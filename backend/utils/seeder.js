require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const KYC = require('../models/KYC');
const { Watchlist } = require('../models/Watchlist');
const logger = require('./logger');

const STOCKS_DATA = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', logo: '🛢️', currentPrice: 2847, previousClose: 2820, marketCap: 1925000, pe: 22.4, pb: 2.1, eps: 127.1, weekHigh52: 3217, weekLow52: 2220, volatilityFactor: 1.0 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', logo: '💻', currentPrice: 4198, previousClose: 4150, marketCap: 1523000, pe: 31.2, pb: 12.4, eps: 134.6, weekHigh52: 4592, weekLow52: 3311, volatilityFactor: 0.8 },
  { symbol: 'INFOSYS', name: 'Infosys Ltd', sector: 'IT', logo: '🖥️', currentPrice: 1876, previousClose: 1842, marketCap: 779000, pe: 27.8, pb: 8.7, eps: 67.5, weekHigh52: 2006, weekLow52: 1351, volatilityFactor: 0.9 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', logo: '🏦', currentPrice: 1654, previousClose: 1630, marketCap: 1250000, pe: 19.2, pb: 2.9, eps: 86.1, weekHigh52: 1794, weekLow52: 1363, volatilityFactor: 0.7 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', logo: '💾', currentPrice: 498, previousClose: 491, marketCap: 273000, pe: 22.1, pb: 3.8, eps: 22.5, weekHigh52: 578, weekLow52: 402, volatilityFactor: 1.1 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', logo: '🏛️', currentPrice: 1087, previousClose: 1070, marketCap: 765000, pe: 17.4, pb: 2.7, eps: 62.5, weekHigh52: 1196, weekLow52: 855, volatilityFactor: 0.8 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', logo: '📡', currentPrice: 1743, previousClose: 1720, marketCap: 1032000, pe: 48.2, pb: 7.1, eps: 36.2, weekHigh52: 1779, weekLow52: 1009, volatilityFactor: 1.2 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', logo: '🧴', currentPrice: 2341, previousClose: 2310, marketCap: 549000, pe: 55.3, pb: 11.2, eps: 42.3, weekHigh52: 2778, weekLow52: 2172, volatilityFactor: 0.6 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', logo: '🌿', currentPrice: 467, previousClose: 462, marketCap: 583000, pe: 27.6, pb: 8.4, eps: 16.9, weekHigh52: 500, weekLow52: 400, volatilityFactor: 0.7 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', logo: '🏧', currentPrice: 798, previousClose: 785, marketCap: 712000, pe: 9.8, pb: 1.4, eps: 81.4, weekHigh52: 912, weekLow52: 629, volatilityFactor: 1.2 },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', logo: '🔧', currentPrice: 5432, previousClose: 5380, marketCap: 160000, pe: 35.6, pb: 9.2, eps: 152.6, weekHigh52: 6767, weekLow52: 4415, volatilityFactor: 1.3 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto', logo: '🚗', currentPrice: 11840, previousClose: 11700, marketCap: 378000, pe: 28.3, pb: 4.8, eps: 418.2, weekHigh52: 13680, weekLow52: 9644, volatilityFactor: 1.1 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance', logo: '💰', currentPrice: 7234, previousClose: 7150, marketCap: 436000, pe: 32.1, pb: 6.3, eps: 225.3, weekHigh52: 8192, weekLow52: 6187, volatilityFactor: 1.4 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paint', logo: '🎨', currentPrice: 2876, previousClose: 2840, marketCap: 275000, pe: 52.1, pb: 14.3, eps: 55.2, weekHigh52: 3394, weekLow52: 2626, volatilityFactor: 0.9 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer', logo: '⌚', currentPrice: 3567, previousClose: 3520, marketCap: 316000, pe: 88.4, pb: 19.6, eps: 40.3, weekHigh52: 3887, weekLow52: 2852, volatilityFactor: 1.0 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', logo: '🏦', currentPrice: 1987, previousClose: 1960, marketCap: 395000, pe: 21.3, pb: 3.4, eps: 93.3, weekHigh52: 2063, weekLow52: 1544, volatilityFactor: 0.8 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', logo: '💊', currentPrice: 1654, previousClose: 1630, marketCap: 397000, pe: 34.7, pb: 6.1, eps: 47.7, weekHigh52: 1960, weekLow52: 1241, volatilityFactor: 1.1 },
  { symbol: 'DRREDDY', name: "Dr Reddy's Laboratories", sector: 'Pharma', logo: '🧪', currentPrice: 6543, previousClose: 6480, marketCap: 109000, pe: 20.8, pb: 4.1, eps: 314.6, weekHigh52: 7663, weekLow52: 5050, volatilityFactor: 1.2 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Power', logo: '⚡', currentPrice: 342, previousClose: 337, marketCap: 318000, pe: 17.2, pb: 3.1, eps: 19.9, weekHigh52: 366, weekLow52: 212, volatilityFactor: 0.6 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', logo: '🔌', currentPrice: 378, previousClose: 373, marketCap: 367000, pe: 19.4, pb: 2.6, eps: 19.5, weekHigh52: 448, weekLow52: 224, volatilityFactor: 0.7 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement', logo: '🏗️', currentPrice: 10234, previousClose: 10100, marketCap: 295000, pe: 42.3, pb: 5.8, eps: 241.9, weekHigh52: 12116, weekLow52: 9097, volatilityFactor: 1.0 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metal', logo: '⚙️', currentPrice: 654, previousClose: 645, marketCap: 147000, pe: 11.2, pb: 1.5, eps: 58.4, weekHigh52: 772, weekLow52: 497, volatilityFactor: 1.5 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Steel', logo: '🔩', currentPrice: 876, previousClose: 865, marketCap: 213000, pe: 18.7, pb: 2.8, eps: 46.9, weekHigh52: 1063, weekLow52: 774, volatilityFactor: 1.6 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Port', logo: '🚢', currentPrice: 1342, previousClose: 1320, marketCap: 290000, pe: 27.4, pb: 5.2, eps: 48.9, weekHigh52: 1622, weekLow52: 958, volatilityFactor: 1.8 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', logo: '💡', currentPrice: 1876, previousClose: 1855, marketCap: 509000, pe: 27.6, pb: 6.8, eps: 68.0, weekHigh52: 1969, weekLow52: 1235, volatilityFactor: 0.9 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT', logo: '📱', currentPrice: 1543, previousClose: 1520, marketCap: 150000, pe: 38.4, pb: 5.3, eps: 40.2, weekHigh52: 1612, weekLow52: 1061, volatilityFactor: 1.2 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Oil', logo: '🛢️', currentPrice: 287, previousClose: 282, marketCap: 361000, pe: 7.4, pb: 1.1, eps: 38.8, weekHigh52: 345, weekLow52: 204, volatilityFactor: 1.3 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining', logo: '⛏️', currentPrice: 456, previousClose: 450, marketCap: 282000, pe: 7.1, pb: 2.9, eps: 64.1, weekHigh52: 502, weekLow52: 221, volatilityFactor: 1.1 },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Diversified', logo: '🏭', currentPrice: 2341, previousClose: 2310, marketCap: 154000, pe: 18.4, pb: 2.1, eps: 127.2, weekHigh52: 2841, weekLow52: 1769, volatilityFactor: 1.0 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Pharma', logo: '🔬', currentPrice: 4876, previousClose: 4820, marketCap: 129000, pe: 68.2, pb: 10.7, eps: 71.5, weekHigh52: 5135, weekLow52: 3342, volatilityFactor: 1.3 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Finance', logo: '📊', currentPrice: 1732, previousClose: 1710, marketCap: 276000, pe: 24.1, pb: 3.7, eps: 71.9, weekHigh52: 1989, weekLow52: 1419, volatilityFactor: 1.1 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', logo: '🏛️', currentPrice: 1189, previousClose: 1173, marketCap: 366000, pe: 14.8, pb: 2.1, eps: 80.3, weekHigh52: 1340, weekLow52: 995, volatilityFactor: 0.9 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ── STOCKS ──
    console.log('🌱 Seeding stocks...');
    await Stock.deleteMany({});
    const stockDocs = STOCKS_DATA.map(s => ({
      ...s,
      openPrice: s.currentPrice,
      dayHigh: s.currentPrice * 1.01,
      dayLow: s.currentPrice * 0.99,
      volume: Math.floor(Math.random() * 5000000 + 500000),
      avgVolume: Math.floor(Math.random() * 4000000 + 1000000),
      change: s.currentPrice - s.previousClose,
      changePercent: ((s.currentPrice - s.previousClose) / s.previousClose) * 100,
      isActive: true,
      isIndexStock: ['RELIANCE','TCS','INFOSYS','HDFCBANK','ICICIBANK','BHARTIARTL','ITC','SBIN','KOTAKBANK','HINDUNILVR'].includes(s.symbol),
      priceHistory: Array.from({ length: 30 }, (_, i) => ({
        close: s.previousClose * (1 + (Math.random() - 0.5) * 0.04),
        timestamp: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      })),
    }));
    await Stock.insertMany(stockDocs);
    console.log(`✅ Seeded ${stockDocs.length} stocks`);

    // ── ADMIN USER ──
    console.log('🌱 Seeding admin user...');
    await User.deleteOne({ email: process.env.ADMIN_EMAIL || 'admin@tradex.in' });
    const admin = await User.create({
      fullName: 'Admin TradeX',
      email: process.env.ADMIN_EMAIL || 'admin@tradex.in',
      mobile: '9000000001',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isActive: true,
      kycStatus: 'approved',
      tradingEnabled: true,
      walletBalance: 10000000,
      emailVerified: true,
      mobileVerified: true,
    });
    console.log(`✅ Admin created: ${admin.email} (ClientID: ${admin.clientId})`);

    // ── DEMO USER ──
    console.log('🌱 Seeding demo user...');
    await User.deleteOne({ email: 'user@tradex.in' });
    const user = await User.create({
      fullName: 'Demo Trader',
      email: 'user@tradex.in',
      mobile: '9876543210',
      password: 'Demo@123456',
      role: 'user',
      isActive: true,
      tradingEnabled: true,
      kycStatus: 'approved',
      walletBalance: 100000,
      availableBalance: 100000,
      openingBalance: 100000,
      usedMargin: 0,
      segment: ['EQ'],
      emailVerified: true,
      mobileVerified: true,
    });
    user.generateDematAccount();
    await user.save();
    
    // Create watchlist for user
    const stocks = await Stock.find({ symbol: { $in: ['RELIANCE', 'TCS', 'INFOSYS', 'HDFCBANK', 'ITC'] } });
    await Watchlist.create({
      user: user._id,
      stocks: stocks.map(s => ({ symbol: s.symbol, stock: s._id })),
    });
    
    console.log(`✅ Demo user created: user@tradex.in / Demo@123456`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin: admin@tradex.in / Admin@123456');
    console.log('  User:  user@tradex.in  / Demo@123456');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
