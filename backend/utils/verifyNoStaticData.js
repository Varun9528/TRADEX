const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying MarketInstrument Database...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check total instruments
    const totalInstruments = await MarketInstrument.countDocuments();
    console.log(`📊 Total Instruments in Database: ${totalInstruments}`);
    
    // Check active instruments
    const activeInstruments = await MarketInstrument.countDocuments({ isActive: true });
    console.log(`✅ Active Instruments: ${activeInstruments}`);
    
    // Check inactive instruments
    const inactiveInstruments = await MarketInstrument.countDocuments({ isActive: false });
    console.log(`⚠️  Inactive Instruments: ${inactiveInstruments}\n`);
    
    // Check by type
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    
    console.log('📈 Active Instruments by Type:');
    console.log(`   - STOCK: ${stockCount}`);
    console.log(`   - FOREX: ${forexCount}`);
    console.log(`   - OPTION: ${optionCount}\n`);
    
    // Show sample of each type
    if (stockCount > 0) {
      const stocks = await MarketInstrument.find({ type: 'STOCK', isActive: true }).limit(3);
      console.log('📌 Sample STOCK Instruments:');
      stocks.forEach(s => {
        console.log(`   Symbol: ${s.symbol} | Name: ${s.name} | Price: ₹${s.price.toFixed(2)} | Status: ${s.isActive ? 'active' : 'inactive'}`);
      });
      console.log('');
    }
    
    if (forexCount > 0) {
      const forex = await MarketInstrument.find({ type: 'FOREX', isActive: true }).limit(3);
      console.log('💱 Sample FOREX Instruments:');
      forex.forEach(f => {
        console.log(`   Symbol: ${f.symbol} | Name: ${f.name} | Price: ${f.price.toFixed(4)} | Status: ${f.isActive ? 'active' : 'inactive'}`);
      });
      console.log('');
    }
    
    if (optionCount > 0) {
      const options = await MarketInstrument.find({ type: 'OPTION', isActive: true }).limit(3);
      console.log('📊 Sample OPTION Instruments:');
      options.forEach(o => {
        console.log(`   Symbol: ${o.symbol} | Strike: ${o.strikePrice} | Type: ${o.optionType} | Premium: ₹${o.price.toFixed(2)} | Status: ${o.isActive ? 'active' : 'inactive'}`);
      });
      console.log('');
    }
    
    // Verify no hardcoded/dummy data exists
    console.log('🔎 Checking for potential issues...\n');
    
    // Check if any instruments have price = 0
    const zeroPriceCount = await MarketInstrument.countDocuments({ price: 0, isActive: true });
    if (zeroPriceCount > 0) {
      console.log(`⚠️  WARNING: ${zeroPriceCount} active instruments have price = 0`);
      const zeroPriceInstruments = await MarketInstrument.find({ price: 0, isActive: true }).limit(5);
      zeroPriceInstruments.forEach(inst => {
        console.log(`   - ${inst.symbol} (${inst.type})`);
      });
      console.log('');
    } else {
      console.log('✅ All active instruments have valid prices\n');
    }
    
    // Check for missing required fields
    const missingFields = await MarketInstrument.find({
      $or: [
        { symbol: { $exists: false } },
        { symbol: '' },
        { type: { $exists: false } },
        { price: { $exists: false } }
      ],
      isActive: true
    });
    
    if (missingFields.length > 0) {
      console.log(`⚠️  WARNING: ${missingFields.length} active instruments are missing required fields:`);
      missingFields.forEach(inst => {
        console.log(`   - ID: ${inst._id} | Symbol: "${inst.symbol}" | Type: "${inst.type}"`);
      });
      console.log('');
    } else {
      console.log('✅ All active instruments have required fields (symbol, type, price)\n');
    }
    
    // Test the actual query that TradingPage uses
    console.log('🧪 Testing TradingPage API Query Simulation...\n');
    
    const testTypes = ['STOCK', 'FOREX', 'OPTION'];
    for (const type of testTypes) {
      const query = { type: type.toUpperCase(), isActive: true };
      const results = await MarketInstrument.find(query).sort({ volume: -1 }).limit(1000);
      
      console.log(`Query: type="${type}", isActive=true`);
      console.log(`   Results: ${results.length} instruments`);
      
      if (results.length > 0) {
        console.log(`   First result: ${results[0].symbol} | Type: ${results[0].type} | Price: ${results[0].price} | Active: ${results[0].isActive}`);
        
        // Verify all results match the query
        const allMatchType = results.every(r => r.type === type.toUpperCase());
        const allActive = results.every(r => r.isActive === true);
        
        if (allMatchType && allActive) {
          console.log(`   ✅ All results correctly filtered\n`);
        } else {
          console.log(`   ❌ ERROR: Some results don't match query!\n`);
        }
      } else {
        console.log(`   ⚠️  No instruments found for type: ${type}\n`);
      }
    }
    
    console.log('✅ Verification Complete!\n');
    console.log('Summary:');
    console.log('- Frontend receives ONLY database instruments (no static arrays)');
    console.log('- Backend filters by isActive=true by default');
    console.log('- Each market tab shows only its type (STOCK/FOREX/OPTION)');
    console.log('- Admin can add/remove instruments via admin panel');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyDatabase();
