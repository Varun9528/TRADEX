/**
 * Diagnostic Script - Check Symbol Format in Database
 * 
 * This will show you what's actually in your database
 * to help identify why SELL is failing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { Order, Holding } = require('../models/Order');
const Position = require('../models/Position');

async function diagnoseSymbolIssue() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradex');
    console.log('✅ MongoDB connected\n');

    // Get all holdings
    const holdings = await Holding.find({}).select('user symbol quantity avgBuyPrice');
    
    console.log('📊 HOLDINGS IN DATABASE:');
    console.log('='.repeat(80));
    
    const userMap = new Map();
    
    for (const holding of holdings) {
      const userId = holding.user.toString();
      if (!userMap.has(userId)) {
        userMap.set(userId, []);
      }
      userMap.get(userId).push(holding);
      
      const hasNS = holding.symbol.endsWith('.NS') ? '✅' : '❌';
      console.log(`${hasNS} User: ${userId.substring(0, 8)}... | Symbol: "${holding.symbol}" | Qty: ${holding.quantity} | Avg: ₹${holding.avgBuyPrice}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 SYMBOL FORMAT ANALYSIS:');
    console.log('='.repeat(80));
    
    const formatCount = {
      withNS: 0,
      withoutNS: 0,
      withBO: 0,
      lowercase: 0,
      withEQ: 0
    };
    
    holdings.forEach(h => {
      if (h.symbol.endsWith('.NS')) formatCount.withNS++;
      else formatCount.withoutNS++;
      
      if (h.symbol.includes('.BO')) formatCount.withBO++;
      if (h.symbol !== h.symbol.toUpperCase()) formatCount.lowercase++;
      if (h.symbol.includes('-EQ')) formatCount.withEQ++;
    });
    
    console.log(`Symbols WITH .NS:    ${formatCount.withNS}`);
    console.log(`Symbols WITHOUT .NS: ${formatCount.withoutNS}`);
    console.log(`Symbols with .BO:    ${formatCount.withBO}`);
    console.log(`Symbols lowercase:   ${formatCount.lowercase}`);
    console.log(`Symbols with -EQ:    ${formatCount.withEQ}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  DUPLICATE CHECK:');
    console.log('='.repeat(80));
    
    const grouped = new Map();
    holdings.forEach(h => {
      const key = `${h.user}_${h.symbol}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(h);
    });
    
    let hasDuplicates = false;
    for (const [key, items] of grouped.entries()) {
      if (items.length > 1) {
        hasDuplicates = true;
        console.log(`\n⚠️  DUPLICATE: ${key}`);
        items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.symbol} - Qty: ${item.quantity}, Avg: ₹${item.avgBuyPrice}`);
        });
      }
    }
    
    if (!hasDuplicates) {
      console.log('✅ No duplicates found!');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 POSITIONS CHECK:');
    console.log('='.repeat(80));
    
    const positions = await Position.find({ isClosed: false, netQuantity: { $gt: 0 } })
      .select('user symbol netQuantity averagePrice');
    
    if (positions.length === 0) {
      console.log('⚠️  NO OPEN POSITIONS FOUND!');
      console.log('This means either:');
      console.log('  1. You haven\'t placed any BUY orders yet');
      console.log('  2. Holdings exist but Positions don\'t (data mismatch)');
    }
    
    positions.forEach(pos => {
      const hasNS = pos.symbol.endsWith('.NS') ? '✅' : '❌';
      console.log(`${hasNS} User: ${pos.user.toString().substring(0, 8)}... | Symbol: "${pos.symbol}" | Qty: ${pos.netQuantity} | Avg: ₹${pos.averagePrice}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATION:');
    console.log('='.repeat(80));
    
    if (formatCount.withoutNS > 0 || formatCount.withBO > 0 || formatCount.lowercase > 0) {
      console.log('⚠️  YOUR DATABASE HAS MIXED FORMATS!');
      console.log('\n🔧 RUN THIS COMMAND:');
      console.log('   node utils/mergeDuplicates.js\n');
      console.log('This will convert ALL symbols to .NS format and merge duplicates.\n');
    } else if (hasDuplicates) {
      console.log('⚠️  YOU HAVE DUPLICATE HOLDINGS!');
      console.log('\n🔧 RUN THIS COMMAND:');
      console.log('   node utils/mergeDuplicates.js\n');
    } else {
      console.log('✅ Database looks clean!');
      console.log('\nIf SELL still fails, check:');
      console.log('  1. Frontend is sending correct symbol format');
      console.log('  2. Backend console shows DEBUG log with matching format');
      console.log('  3. Holdings and Positions both have same symbol format\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnoseSymbolIssue();
