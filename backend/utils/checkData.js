const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const total = await MarketInstrument.countDocuments();
    const stocks = await MarketInstrument.countDocuments({ type: 'STOCK' });
    const forex = await MarketInstrument.countDocuments({ type: 'FOREX' });
    const options = await MarketInstrument.countDocuments({ type: 'OPTION' });
    
    console.log('═══════════════════════════════════════');
    console.log('DATABASE INSTRUMENT COUNTS:');
    console.log('═══════════════════════════════════════');
    console.log(`Total Instruments: ${total}`);
    console.log(`  ├─ Stocks: ${stocks}`);
    console.log(`  ├─ Forex: ${forex}`);
    console.log(`  └─ Options: ${options}`);
    console.log('═══════════════════════════════════════\n');
    
    // Show sample stocks
    if (stocks > 0) {
      const sampleStocks = await MarketInstrument.find({ type: 'STOCK' }).limit(5).select('symbol name price');
      console.log('Sample Stocks:');
      sampleStocks.forEach(s => {
        console.log(`  - ${s.symbol}: ${s.name} (₹${s.price.toFixed(2)})`);
      });
      console.log('');
    }
    
    // Show sample forex
    if (forex > 0) {
      const sampleForex = await MarketInstrument.find({ type: 'FOREX' }).limit(5).select('symbol name price');
      console.log('Sample Forex Pairs:');
      sampleForex.forEach(f => {
        console.log(`  - ${f.symbol}: ${f.name} (${f.price.toFixed(4)})`);
      });
      console.log('');
    }
    
    // Show sample options
    if (options > 0) {
      const sampleOptions = await MarketInstrument.find({ type: 'OPTION' }).limit(5).select('symbol name strikePrice optionType price');
      console.log('Sample Options:');
      sampleOptions.forEach(o => {
        console.log(`  - ${o.symbol}: ${o.name} (Strike: ${o.strikePrice}, Type: ${o.optionType}, Premium: ₹${o.price.toFixed(2)})`);
      });
      console.log('');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
