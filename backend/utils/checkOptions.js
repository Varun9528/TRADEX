const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function checkOptions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected\n');
    
    // Get first 5 options
    const options = await MarketInstrument.find({}).limit(5).select('symbol name type isActive').lean();
    
    console.log('First 5 instruments:');
    options.forEach((opt, i) => {
      console.log(`${i+1}. ${opt.symbol.padEnd(20)} | Type: ${opt.type?.padEnd(10)} | Active: ${opt.isActive}`);
    });
    
    // Count by type
    const types = await MarketInstrument.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nCounts by type:');
    types.forEach(t => {
      console.log(`  ${t._id}: ${t.count}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkOptions();
