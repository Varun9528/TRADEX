const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

async function clearAllInstruments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Count before deletion
    const countBefore = await MarketInstrument.countDocuments();
    console.log(`\n📊 Instruments before deletion: ${countBefore}`);

    if (countBefore === 0) {
      console.log('\n✅ Database is already empty. No action needed.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete all instruments
    console.log('\n🗑️  Deleting ALL market instruments...');
    const result = await MarketInstrument.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} instruments`);

    // Verify deletion
    const countAfter = await MarketInstrument.countDocuments();
    console.log(`\n📊 Instruments after deletion: ${countAfter}`);

    if (countAfter === 0) {
      console.log('\n✅ SUCCESS! All instruments cleared from database.');
      console.log('\n📝 Next steps:');
      console.log('1. Admin must upload instruments via admin panel');
      console.log('2. Trading page will show "No instruments available" until then');
      console.log('3. Market Watch will show count of admin-uploaded instruments only');
    } else {
      console.error('\n❌ ERROR: Some instruments remain in database!');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

clearAllInstruments();
