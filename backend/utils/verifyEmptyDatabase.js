const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

async function verifyEmptyDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Total count
    const total = await MarketInstrument.countDocuments();
    console.log(`📊 Total instruments: ${total}`);

    // Count by type
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK' });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX' });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION' });

    console.log(`   - STOCK: ${stockCount}`);
    console.log(`   - FOREX: ${forexCount}`);
    console.log(`   - OPTION: ${optionCount}\n`);

    if (total === 0) {
      console.log('✅ Database is EMPTY - Ready for admin uploads');
      console.log('\nExpected behavior:');
      console.log('- TradingPage: "No instruments available"');
      console.log('- Market Watch: Count = 0');
      console.log('- Admin must upload instruments via admin panel');
    } else {
      console.error('❌ ERROR: Database still has instruments!');
      console.error('   Run clearAllInstruments.js again');
    }

    await mongoose.disconnect();
    process.exit(total === 0 ? 0 : 1);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyEmptyDatabase();
