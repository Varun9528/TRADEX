const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

// ─── INDIAN STOCKS (NSE) - 20 MAJOR STOCKS ──────────────────────────────────────
const indianStocks = [
  // NIFTY 50 Top Stocks
  { 
    name: 'Reliance Industries', 
    symbol: 'RELIANCE', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 2456.75,
    open: 2440.00,
    high: 2470.00,
    low: 2430.00,
    close: 2445.00,
    volume: 8500000,
    sector: 'Oil & Gas'
  },
  { 
    name: 'Tata Consultancy Services', 
    symbol: 'TCS', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 3678.90,
    open: 3650.00,
    high: 3695.00,
    low: 3640.00,
    close: 3655.00,
    volume: 3200000,
    sector: 'IT'
  },
  { 
    name: 'HDFC Bank', 
    symbol: 'HDFCBANK', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 1687.45,
    open: 1675.00,
    high: 1695.00,
    low: 1670.00,
    close: 1678.00,
    volume: 12500000,
    sector: 'Banking'
  },
  { 
    name: 'Infosys', 
    symbol: 'INFY', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 1456.30,
    open: 1445.00,
    high: 1465.00,
    low: 1440.00,
    close: 1448.00,
    volume: 9800000,
    sector: 'IT'
  },
  { 
    name: 'ICICI Bank', 
    symbol: 'ICICIBANK', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 978.65,
    open: 970.00,
    high: 985.00,
    low: 965.00,
    close: 972.00,
    volume: 15600000,
    sector: 'Banking'
  },
  { 
    name: 'State Bank of India', 
    symbol: 'SBIN', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 623.80,
    open: 618.00,
    high: 628.00,
    low: 615.00,
    close: 620.00,
    volume: 18900000,
    sector: 'Banking'
  },
  { 
    name: 'ITC Limited', 
    symbol: 'ITC', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 456.75,
    open: 452.00,
    high: 460.00,
    low: 450.00,
    close: 454.00,
    volume: 22000000,
    sector: 'FMCG'
  },
  { 
    name: 'Larsen & Toubro', 
    symbol: 'LT', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 3234.50,
    open: 3210.00,
    high: 3250.00,
    low: 3200.00,
    close: 3215.00,
    volume: 2100000,
    sector: 'Engineering'
  },
  { 
    name: 'Axis Bank', 
    symbol: 'AXISBANK', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 1089.40,
    open: 1080.00,
    high: 1095.00,
    low: 1075.00,
    close: 1082.00,
    volume: 11200000,
    sector: 'Banking'
  },
  { 
    name: 'Kotak Mahindra Bank', 
    symbol: 'KOTAKBANK', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 1789.25,
    open: 1775.00,
    high: 1800.00,
    low: 1770.00,
    close: 1778.00,
    volume: 4500000,
    sector: 'Banking'
  },
  { 
    name: 'Bajaj Finance', 
    symbol: 'BAJFINANCE', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 6789.50,
    open: 6750.00,
    high: 6820.00,
    low: 6730.00,
    close: 6755.00,
    volume: 1800000,
    sector: 'Finance'
  },
  { 
    name: 'Maruti Suzuki', 
    symbol: 'MARUTI', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 10234.75,
    open: 10180.00,
    high: 10280.00,
    low: 10150.00,
    close: 10185.00,
    volume: 850000,
    sector: 'Automobile'
  },
  { 
    name: 'Asian Paints', 
    symbol: 'ASIANPAINT', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 2876.30,
    open: 2860.00,
    high: 2890.00,
    low: 2850.00,
    close: 2865.00,
    volume: 2300000,
    sector: 'FMCG'
  },
  { 
    name: 'Wipro', 
    symbol: 'WIPRO', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 456.80,
    open: 452.00,
    high: 460.00,
    low: 450.00,
    close: 454.00,
    volume: 14500000,
    sector: 'IT'
  },
  { 
    name: 'UltraTech Cement', 
    symbol: 'ULTRACEMCO', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 8567.90,
    open: 8520.00,
    high: 8600.00,
    low: 8500.00,
    close: 8530.00,
    volume: 650000,
    sector: 'Cement'
  },
  { 
    name: 'ONGC', 
    symbol: 'ONGC', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 234.50,
    open: 231.00,
    high: 237.00,
    low: 230.00,
    close: 232.00,
    volume: 28000000,
    sector: 'Oil & Gas'
  },
  { 
    name: 'NTPC', 
    symbol: 'NTPC', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 289.75,
    open: 286.00,
    high: 292.00,
    low: 285.00,
    close: 287.00,
    volume: 19500000,
    sector: 'Power'
  },
  { 
    name: 'Power Grid Corporation', 
    symbol: 'POWERGRID', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 267.40,
    open: 264.00,
    high: 270.00,
    low: 262.00,
    close: 265.00,
    volume: 16700000,
    sector: 'Power'
  },
  { 
    name: 'Sun Pharma', 
    symbol: 'SUNPHARMA', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 1234.60,
    open: 1225.00,
    high: 1245.00,
    low: 1220.00,
    close: 1228.00,
    volume: 5600000,
    sector: 'Pharma'
  },
  { 
    name: 'Titan Company', 
    symbol: 'TITAN', 
    type: 'STOCK', 
    exchange: 'NSE', 
    price: 3456.80,
    open: 3430.00,
    high: 3475.00,
    low: 3420.00,
    close: 3435.00,
    volume: 3400000,
    sector: 'FMCG'
  },
];

// ─── FOREX PAIRS - 12 MAJOR PAIRS ──────────────────────────────────────
const forexPairs = [
  { 
    name: 'Euro / US Dollar', 
    symbol: 'EURUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 1.0875,
    open: 1.0850,
    high: 1.0890,
    low: 1.0840,
    close: 1.0855,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'US Dollar / Japanese Yen', 
    symbol: 'USDJPY', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 151.25,
    open: 150.80,
    high: 151.50,
    low: 150.60,
    close: 150.90,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'British Pound / US Dollar', 
    symbol: 'GBPUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 1.2645,
    open: 1.2620,
    high: 1.2670,
    low: 1.2610,
    close: 1.2625,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'Australian Dollar / US Dollar', 
    symbol: 'AUDUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 0.6578,
    open: 0.6560,
    high: 0.6590,
    low: 0.6550,
    close: 0.6565,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'US Dollar / Canadian Dollar', 
    symbol: 'USDCAD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 1.3542,
    open: 1.3520,
    high: 1.3560,
    low: 1.3510,
    close: 1.3525,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'US Dollar / Swiss Franc', 
    symbol: 'USDCHF', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 0.8923,
    open: 0.8905,
    high: 0.8940,
    low: 0.8895,
    close: 0.8910,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'New Zealand Dollar / US Dollar', 
    symbol: 'NZDUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 0.6123,
    open: 0.6105,
    high: 0.6140,
    low: 0.6095,
    close: 0.6110,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'Euro / Japanese Yen', 
    symbol: 'EURJPY', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 164.45,
    open: 164.00,
    high: 164.80,
    low: 163.80,
    close: 164.10,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'British Pound / Japanese Yen', 
    symbol: 'GBPJPY', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 191.23,
    open: 190.70,
    high: 191.60,
    low: 190.50,
    close: 190.80,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'Euro / British Pound', 
    symbol: 'EURGBP', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 0.8598,
    open: 0.8580,
    high: 0.8615,
    low: 0.8570,
    close: 0.8585,
    volume: 0,
    sector: 'Currency'
  },
  { 
    name: 'Gold (Spot)', 
    symbol: 'XAUUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 2345.67,
    open: 2335.00,
    high: 2355.00,
    low: 2330.00,
    close: 2338.00,
    volume: 0,
    sector: 'Commodity'
  },
  { 
    name: 'Silver (Spot)', 
    symbol: 'XAGUSD', 
    type: 'FOREX', 
    exchange: 'FOREX', 
    price: 28.45,
    open: 28.20,
    high: 28.70,
    low: 28.10,
    close: 28.25,
    volume: 0,
    sector: 'Commodity'
  },
];

async function seedMarket() {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    
    // Connect to MongoDB - use .env MONGODB_URI or fallback
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://varuntirole210:Varun%4007067@worksuperfast.2ra3pek.mongodb.net/tradex_india?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] MongoDB connected:', mongoose.connection.name);

    // Clear existing instruments (optional - comment out if you want to keep existing data)
    console.log('[Seeder] Clearing existing instruments...');
    await MarketInstrument.deleteMany({});
    console.log('[Seeder] Existing instruments cleared');

    // Insert Indian stocks
    console.log(`[Seeder] Seeding ${indianStocks.length} Indian stocks...`);
    await MarketInstrument.insertMany(indianStocks);
    console.log(`[Seeder] ✅ ${indianStocks.length} Indian stocks added`);

    // Insert Forex pairs
    console.log(`[Seeder] Seeding ${forexPairs.length} Forex pairs...`);
    await MarketInstrument.insertMany(forexPairs);
    console.log(`[Seeder] ✅ ${forexPairs.length} Forex pairs added`);

    console.log('\n[Seeder] 🎉 Market seeding completed successfully!');
    console.log(`[Seeder] Total instruments: ${indianStocks.length + forexPairs.length}`);
    console.log(`[Seeder] - Indian Stocks: ${indianStocks.length}`);
    console.log(`[Seeder] - Forex Pairs: ${forexPairs.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { indianStocks, forexPairs, seedMarket };

// Run seeder only if executed directly
if (require.main === module) {
  seedMarket();
}
