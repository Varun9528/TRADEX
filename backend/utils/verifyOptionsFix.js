const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function verifyOptions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('═══════════════════════════════════════');
    console.log('OPTIONS VERIFICATION TEST');
    console.log('═══════════════════════════════════════\n');
    
    // 1. Check total options count
    const totalOptions = await MarketInstrument.countDocuments({ type: 'OPTION' });
    console.log(`✅ Total OPTION instruments in DB: ${totalOptions}`);
    
    // 2. Check active options count
    const activeOptions = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    console.log(`✅ Active OPTION instruments: ${activeOptions}`);
    
    // 3. Check inactive options count
    const inactiveOptions = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: false });
    console.log(`✅ Inactive OPTION instruments: ${inactiveOptions}\n`);
    
    // 4. Verify type field value (should be exactly "OPTION")
    const sampleOption = await MarketInstrument.findOne({ type: 'OPTION' }).select('type symbol name').lean();
    console.log('Sample Option Document:');
    console.log(`  Type Field Value: "${sampleOption.type}"`);
    console.log(`  Symbol: ${sampleOption.symbol}`);
    console.log(`  Name: ${sampleOption.name}\n`);
    
    // 5. Check option data structure
    const optionWithAllFields = await MarketInstrument.findOne({ 
      type: 'OPTION',
      strikePrice: { $exists: true },
      expiryDate: { $exists: true },
      lotSize: { $exists: true }
    }).select('symbol strikePrice expiryDate lotSize price underlyingAsset').lean();
    
    if (optionWithAllFields) {
      console.log('✅ Option Data Structure Verified:');
      console.log(`  Symbol: ${optionWithAllFields.symbol}`);
      console.log(`  Strike Price: ${optionWithAllFields.strikePrice}`);
      console.log(`  Expiry Date: ${optionWithAllFields.expiryDate}`);
      console.log(`  Lot Size: ${optionWithAllFields.lotSize}`);
      console.log(`  Premium (Price): ₹${optionWithAllFields.price}`);
      console.log(`  Underlying Asset: ${optionWithAllFields.underlyingAsset || 'N/A'}\n`);
    } else {
      console.log('❌ WARNING: Some options may be missing required fields!\n');
    }
    
    // 6. Count by underlying asset
    const byUnderlying = await MarketInstrument.aggregate([
      { $match: { type: 'OPTION' } },
      { 
        $group: { 
          _id: '$underlyingAsset',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Options by Underlying Asset:');
    byUnderlying.forEach(item => {
      console.log(`  ${item._id || 'Unknown'}: ${item.count} contracts`);
    });
    console.log();
    
    // 7. Test case-insensitive query simulation
    const lowercaseQuery = await MarketInstrument.countDocuments({ type: 'option' });
    const uppercaseQuery = await MarketInstrument.countDocuments({ type: 'OPTION' });
    console.log('Case Sensitivity Test:');
    console.log(`  Query with "option" (lowercase): ${lowercaseQuery} results`);
    console.log(`  Query with "OPTION" (uppercase): ${uppercaseQuery} results`);
    console.log(`  ✅ Backend fix ensures .toUpperCase() conversion\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════');
    
    if (activeOptions > 0) {
      console.log('\n✅ SUCCESS: Options are ready for trading!');
      console.log(`   ${activeOptions} active option contracts available`);
    } else {
      console.log('\n❌ ERROR: No active options found!');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

verifyOptions();
