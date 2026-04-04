const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

async function removeTestInstruments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Remove test/demo instruments
    const testSymbols = ['ASDASD', 'TEST', 'DEMO'];
    
    console.log('🗑️  Removing test instruments...');
    const result = await MarketInstrument.deleteMany({ symbol: { $in: testSymbols } });
    console.log(`✅ Deleted ${result.deletedCount} test instruments\n`);

    // Verify final counts
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    const total = stockCount + forexCount + optionCount;

    console.log('📊 FINAL CLEAN DATABASE:');
    console.log(`   Total Instruments: ${total}`);
    console.log(`   - STOCK: ${stockCount}`);
    console.log(`   - FOREX: ${forexCount}`);
    console.log(`   - OPTION: ${optionCount}\n`);

    console.log('✅ Database cleaned successfully!');

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

removeTestInstruments();
