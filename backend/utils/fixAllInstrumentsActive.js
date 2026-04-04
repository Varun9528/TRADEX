const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function fixAllInstruments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Check current status
    const stockActive = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const stockInactive = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: false });
    const forexActive = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const forexInactive = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: false });
    const optionActive = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    const optionInactive = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: false });
    
    console.log('Current Status:');
    console.log(`  Stocks: ${stockActive} active, ${stockInactive} inactive`);
    console.log(`  Forex: ${forexActive} active, ${forexInactive} inactive`);
    console.log(`  Options: ${optionActive} active, ${optionInactive} inactive`);
    console.log();
    
    // Update ALL instruments to isActive: true
    const result = await MarketInstrument.updateMany(
      {},
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} instruments to Active status\n`);
    
    // Verify the update
    const totalActive = await MarketInstrument.countDocuments({ isActive: true });
    const totalInactive = await MarketInstrument.countDocuments({ isActive: false });
    
    console.log('After Update:');
    console.log(`  Total Active: ${totalActive}`);
    console.log(`  Total Inactive: ${totalInactive}`);
    console.log();
    
    // Check types are correct
    const types = await MarketInstrument.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Verification by Type:');
    types.forEach(t => {
      console.log(`  ${t._id}: ${t.count} total, ${t.active} active`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ All instruments are now ACTIVE and ready!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

fixAllInstruments();
