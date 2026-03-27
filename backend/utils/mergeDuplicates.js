/**
 * Script to migrate all holdings to NSE format (.NS suffix)
 * 
 * This script will:
 * 1. Find all holdings
 * 2. Normalize symbols to .NS format (RELIANCE → RELIANCE.NS)
 * 3. Merge duplicates (same user + normalized symbol)
 * 4. Update orders and positions to .NS format
 * 
 * Run once to fix existing duplicate data in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { normalizeSymbol } = require('./utils/symbols');
const { Order, Holding } = require('./models/Order');
const Position = require('./models/Position');
const User = require('./models/User');

async function mergeDuplicateHoldings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradex');
    console.log('✅ MongoDB connected');

    // Get all holdings
    const allHoldings = await Holding.find({});
    console.log(`\n📊 Found ${allHoldings.length} total holdings\n`);

    // Group holdings by user and normalized symbol (now with .NS)
    const groupedHoldings = new Map();
    
    for (const holding of allHoldings) {
      const normalizedSymbol = normalizeSymbol(holding.symbol);
      if (!normalizedSymbol) {
        console.log(`⚠️  Skipping holding with invalid symbol: ${holding._id}`);
        continue;
      }
      
      const key = `${holding.user}_${normalizedSymbol}`;
      
      if (!groupedHoldings.has(key)) {
        groupedHoldings.set(key, []);
      }
      
      groupedHoldings.get(key).push({
        ...holding.toObject(),
        normalizedSymbol,
        originalSymbol: holding.symbol  // Keep track of original for logging
      });
    }

    console.log(`📊 Found ${groupedHoldings.size} unique user+symbol combinations\n`);

    let mergedCount = 0;
    let deletedCount = 0;
    let updatedCount = 0;

    // Process each group
    for (const [key, holdings] of groupedHoldings.entries()) {
      if (holdings.length > 1) {
        const userId = key.split('_')[0];
        const cleanSymbol = holdings[0].normalizedSymbol;
        
        console.log(`⚠️  Duplicate found for user ${userId}, symbol ${cleanSymbol}:`);
        console.log(`   - Count: ${holdings.length} entries`);
        
        // Sort by _id to keep the oldest one as primary
        holdings.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
        
        const primary = holdings[0];
        const duplicates = holdings.slice(1);
        
        console.log(`   - Primary: ${primary.originalSymbol} → ${primary.normalizedSymbol} (qty: ${primary.quantity}, avgPrice: ₹${primary.avgBuyPrice})`);
        
        // Calculate merged values
        let totalQty = primary.quantity;
        let totalCost = primary.quantity * primary.avgBuyPrice;
        
        for (const dup of duplicates) {
          console.log(`   - Merging: ${dup.originalSymbol} → ${dup.normalizedSymbol} (qty: ${dup.quantity}, avgPrice: ₹${dup.avgBuyPrice})`);
          totalQty += dup.quantity;
          totalCost += dup.quantity * dup.avgBuyPrice;
        }
        
        const newAvgPrice = Number((totalCost / totalQty).toFixed(2));
        const newTotalInvested = Number((totalQty * newAvgPrice).toFixed(2));
        
        console.log(`   → Merged: qty=${totalQty}, avgPrice=₹${newAvgPrice}, totalInvested=₹${newTotalInvested}\n`);
        
        // Update primary holding with merged values and normalized .NS symbol
        await Holding.findByIdAndUpdate(primary._id, {
          quantity: totalQty,
          avgBuyPrice: newAvgPrice,
          totalInvested: newTotalInvested,
          symbol: cleanSymbol  // Force .NS format
        });
        
        // Delete duplicate holdings
        for (const dup of duplicates) {
          await Holding.findByIdAndDelete(dup._id);
          deletedCount++;
        }
        
        mergedCount++;
      } else if (holdings.length === 1) {
        // Even single holdings should be converted to .NS format
        const holding = holdings[0];
        const normalizedSymbol = normalizeSymbol(holding.symbol);
        
        if (holding.symbol !== normalizedSymbol) {
          console.log(`🔄 Converting: ${holding.symbol} → ${normalizedSymbol}`);
          await Holding.findByIdAndUpdate(holding._id, {
            symbol: normalizedSymbol
          });
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Holdings processing complete`);
    console.log(`   - Merged groups: ${mergedCount}`);
    console.log(`   - Deleted duplicates: ${deletedCount}`);
    console.log(`   - Normalized symbols: ${updatedCount}\n`);

    // Now update all orders to use normalized symbols
    console.log('🔄 Updating orders with normalized symbols...');
    const allOrders = await Order.find({});
    let updatedOrders = 0;
    
    for (const order of allOrders) {
      const normalizedSymbol = normalizeSymbol(order.symbol);
      if (normalizedSymbol && normalizedSymbol !== order.symbol) {
        await Order.findByIdAndUpdate(order._id, {
          symbol: normalizedSymbol
        });
        updatedOrders++;
      }
    }
    
    console.log(`✅ Updated ${updatedOrders} orders with normalized symbols\n`);

    // Update all positions to use normalized symbols
    console.log('🔄 Updating positions with normalized symbols...');
    const allPositions = await Position.find({});
    let updatedPositions = 0;
    
    for (const position of allPositions) {
      const normalizedSymbol = normalizeSymbol(position.symbol);
      if (normalizedSymbol && normalizedSymbol !== position.symbol) {
        await Position.findByIdAndUpdate(position._id, {
          symbol: normalizedSymbol
        });
        updatedPositions++;
      }
    }
    
    console.log(`✅ Updated ${updatedPositions} positions with normalized symbols\n`);

    // Verify no duplicates remain
    console.log('🔍 Verifying no duplicates remain...');
    const remainingHoldings = await Holding.find({});
    const remainingGroups = new Map();
    
    for (const holding of remainingHoldings) {
      const normalizedSymbol = normalizeSymbol(holding.symbol);
      const key = `${holding.user}_${normalizedSymbol}`;
      
      if (!remainingGroups.has(key)) {
        remainingGroups.set(key, 0);
      }
      remainingGroups.set(key, remainingGroups.get(key) + 1);
    }
    
    let duplicateCount = 0;
    for (const [key, count] of remainingGroups.entries()) {
      if (count > 1) {
        duplicateCount++;
        console.log(`⚠️  WARNING: Still has duplicates for ${key}`);
      }
    }
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicates found! Database is clean.\n');
    } else {
      console.log(`⚠️  WARNING: ${duplicateCount} groups still have duplicates\n`);
    }

    console.log('🎉 Database normalization complete!');
    console.log('\n📋 Final Summary:');
    console.log(`   - Holdings merged: ${mergedCount} groups`);
    console.log(`   - Holdings deleted: ${deletedCount} duplicates`);
    console.log(`   - Holdings normalized: ${updatedCount}`);
    console.log(`   - Orders updated: ${updatedOrders}`);
    console.log(`   - Positions updated: ${updatedPositions}`);
    console.log(`   - Remaining duplicates: ${duplicateCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
mergeDuplicateHoldings();
