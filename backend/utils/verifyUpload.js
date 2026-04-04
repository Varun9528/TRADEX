const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

async function verifyUpload() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Total count
    const total = await MarketInstrument.countDocuments();
    console.log(`📊 TOTAL INSTRUMENTS: ${total}\n`);

    // Count by type
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });

    console.log('📋 BREAKDOWN BY TYPE:');
    console.log(`   ✅ STOCK (Indian Market): ${stockCount}`);
    console.log(`   ✅ FOREX (Forex Market): ${forexCount}`);
    console.log(`   ✅ OPTION (Options): ${optionCount}\n`);

    // Sample from each type
    console.log('🔍 SAMPLE INSTRUMENTS:\n');

    console.log('--- INDIAN MARKET (First 5 stocks) ---');
    const sampleStocks = await MarketInstrument.find({ type: 'STOCK', isActive: true }).limit(5).select('symbol name price');
    sampleStocks.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.symbol} - ${s.name} (₹${s.price})`);
    });

    console.log('\n--- FOREX MARKET (First 5 pairs) ---');
    const sampleForex = await MarketInstrument.find({ type: 'FOREX', isActive: true }).limit(5).select('symbol name price');
    sampleForex.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.symbol} - ${f.name} (${f.price})`);
    });

    console.log('\n--- OPTIONS (First 5 contracts) ---');
    const sampleOptions = await MarketInstrument.find({ type: 'OPTION', isActive: true }).limit(5).select('symbol name strikePrice optionType');
    sampleOptions.forEach((o, i) => {
      console.log(`   ${i + 1}. ${o.symbol} - ${o.strikePrice} ${o.optionType}`);
    });

    // Verify no mixed data
    console.log('\n✅ VERIFICATION CHECKS:');

    // Check 1: All STOCK have correct type
    const wrongStocks = await MarketInstrument.find({ type: { $ne: 'STOCK' }, symbol: { $in: ['RELIANCE', 'TCS', 'INFY'] } });
    if (wrongStocks.length === 0) {
      console.log('   ✅ Indian stocks have correct type=STOCK');
    } else {
      console.log('   ❌ ERROR: Some stocks have wrong type!');
    }

    // Check 2: All FOREX have correct type
    const wrongForex = await MarketInstrument.find({ type: { $ne: 'FOREX' }, symbol: { $in: ['EURUSD', 'GBPUSD', 'USDJPY'] } });
    if (wrongForex.length === 0) {
      console.log('   ✅ Forex pairs have correct type=FOREX');
    } else {
      console.log('   ❌ ERROR: Some forex pairs have wrong type!');
    }

    // Check 3: All OPTION have correct type
    const wrongOptions = await MarketInstrument.find({ type: { $ne: 'OPTION' }, symbol: { $in: ['NIFTY20000CE', 'BANKNIFTY45000CE'] } });
    if (wrongOptions.length === 0) {
      console.log('   ✅ Options have correct type=OPTION');
    } else {
      console.log('   ❌ ERROR: Some options have wrong type!');
    }

    // Check 4: All instruments are active
    const inactiveCount = await MarketInstrument.countDocuments({ isActive: false });
    if (inactiveCount === 0) {
      console.log('   ✅ All instruments are active (isActive=true)');
    } else {
      console.log(`   ⚠️  Warning: ${inactiveCount} instruments are inactive`);
    }

    console.log('\n🎯 EXPECTED TRADINGPAGE BEHAVIOR:');
    console.log(`   • Indian Market tab → Shows ${stockCount} stocks`);
    console.log(`   • Forex Market tab → Shows ${forexCount} forex pairs`);
    console.log(`   • Options tab → Shows ${optionCount} options`);
    console.log(`   • Market Watch count changes with tab selection`);
    console.log(`   • NO MIXED DATA between tabs`);

    console.log('\n✅ UPLOAD VERIFICATION COMPLETE!');
    console.log('\n📝 Testing Instructions:');
    console.log('1. Start backend: npm start');
    console.log('2. Open TradingPage in browser');
    console.log('3. Click "Indian Market" tab → Should show', stockCount, 'stocks');
    console.log('4. Click "Forex Market" tab → Should show', forexCount, 'forex pairs');
    console.log('5. Click "Options" tab → Should show', optionCount, 'options');
    console.log('6. Verify Market Watch count matches each tab');

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

verifyUpload();
