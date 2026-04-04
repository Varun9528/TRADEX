const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function enableTradingForAllUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Count users before update
    const totalUsers = await User.countDocuments();
    const alreadyEnabled = await User.countDocuments({ tradingEnabled: true });
    const needEnable = await User.countDocuments({ tradingEnabled: false });

    console.log('📊 Current Status:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Trading Enabled: ${alreadyEnabled}`);
    console.log(`   Trading Disabled: ${needEnable}\n`);

    if (needEnable === 0) {
      console.log('✅ All users already have trading enabled. No update needed.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update all users with tradingEnabled = false to true
    console.log('🔄 Enabling trading for all users...\n');
    const result = await User.updateMany(
      { tradingEnabled: false },
      { $set: { tradingEnabled: true } }
    );

    console.log('✅ Update completed!');
    console.log(`   Users updated: ${result.modifiedCount}\n`);

    // Verify final status
    const finalEnabled = await User.countDocuments({ tradingEnabled: true });
    const finalDisabled = await User.countDocuments({ tradingEnabled: false });

    console.log('📊 Final Status:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Trading Enabled: ${finalEnabled} ✅`);
    console.log(`   Trading Disabled: ${finalDisabled}\n`);

    console.log('✅ SUCCESS! All users now have trading enabled by default.');
    console.log('\n📝 Admin can disable trading for specific users via admin panel.');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

enableTradingForAllUsers();
