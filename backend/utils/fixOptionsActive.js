const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function fixOptions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Update all OPTION type instruments to isActive: true
    const result = await MarketInstrument.updateMany(
      { type: 'OPTION' },
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} option contracts to Active status`);
    
    // Verify the update
    const activeCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    const inactiveCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: false });
    
    console.log(`\nVerification:`);
    console.log(`  Active Options: ${activeCount}`);
    console.log(`  Inactive Options: ${inactiveCount}`);
    
    await mongoose.disconnect();
    console.log('\n✅ All options are now active and visible on trading page!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixOptions();
