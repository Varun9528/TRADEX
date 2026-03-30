const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

// ─── INDIAN STOCKS (NSE) ──────────────────────────────────────
const indianStocks = [
  // NIFTY 50 Major Stocks
  { name: 'Reliance Industries', symbol: 'RELIANCE', type: 'STOCK', exchange: 'NSE', price: 2456.75, sector: 'Oil & Gas' },
  { name: 'Tata Consultancy Services', symbol: 'TCS', type: 'STOCK', exchange: 'NSE', price: 3678.90, sector: 'IT' },
  { name: 'HDFC Bank', symbol: 'HDFCBANK', type: 'STOCK', exchange: 'NSE', price: 1687.45, sector: 'Banking' },
  { name: 'Infosys', symbol: 'INFY', type: 'STOCK', exchange: 'NSE', price: 1456.30, sector: 'IT' },
  { name: 'ICICI Bank', symbol: 'ICICIBANK', type: 'STOCK', exchange: 'NSE', price: 978.65, sector: 'Banking' },
  { name: 'State Bank of India', symbol: 'SBIN', type: 'STOCK', exchange: 'NSE', price: 623.80, sector: 'Banking' },
  { name: 'Hindustan Unilever', symbol: 'HINDUNILVR', type: 'STOCK', exchange: 'NSE', price: 2567.20, sector: 'FMCG' },
  { name: 'ITC Limited', symbol: 'ITC', type: 'STOCK', exchange: 'NSE', price: 456.75, sector: 'FMCG' },
  { name: 'Larsen & Toubro', symbol: 'LT', type: 'STOCK', exchange: 'NSE', price: 3234.50, sector: 'Engineering' },
  { name: 'Axis Bank', symbol: 'AXISBANK', type: 'STOCK', exchange: 'NSE', price: 1089.30, sector: 'Banking' },
  
  // More NIFTY Stocks
  { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', type: 'STOCK', exchange: 'NSE', price: 1789.45, sector: 'Banking' },
  { name: 'Asian Paints', symbol: 'ASIANPAINT', type: 'STOCK', exchange: 'NSE', price: 2987.60, sector: 'Paints' },
  { name: 'Maruti Suzuki', symbol: 'MARUTI', type: 'STOCK', exchange: 'NSE', price: 10234.75, sector: 'Automobile' },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', type: 'STOCK', exchange: 'NSE', price: 7123.40, sector: 'Finance' },
  { name: 'Wipro', symbol: 'WIPRO', type: 'STOCK', exchange: 'NSE', price: 456.90, sector: 'IT' },
  { name: 'HCL Technologies', symbol: 'HCLTECH', type: 'STOCK', exchange: 'NSE', price: 1234.55, sector: 'IT' },
  { name: 'Tata Motors', symbol: 'TATAMOTORS', type: 'STOCK', exchange: 'NSE', price: 678.25, sector: 'Automobile' },
  { name: 'Adani Enterprises', symbol: 'ADANIENT', type: 'STOCK', exchange: 'NSE', price: 2345.80, sector: 'Diversified' },
  { name: 'Sun Pharma', symbol: 'SUNPHARMA', type: 'STOCK', exchange: 'NSE', price: 1123.45, sector: 'Pharma' },
  { name: 'Titan Company', symbol: 'TITAN', type: 'STOCK', exchange: 'NSE', price: 3456.70, sector: 'Consumer Goods' },
  
  // More Stocks
  { name: 'Bharti Airtel', symbol: 'BHARTIARTL', type: 'STOCK', exchange: 'NSE', price: 987.35, sector: 'Telecom' },
  { name: 'Power Grid Corporation', symbol: 'POWERGRID', type: 'STOCK', exchange: 'NSE', price: 234.60, sector: 'Power' },
  { name: 'NTPC Limited', symbol: 'NTPC', type: 'STOCK', exchange: 'NSE', price: 267.85, sector: 'Power' },
  { name: 'UltraTech Cement', symbol: 'ULTRACEMCO', type: 'STOCK', exchange: 'NSE', price: 8765.30, sector: 'Cement' },
  { name: 'Mahindra & Mahindra', symbol: 'M&M', type: 'STOCK', exchange: 'NSE', price: 1678.90, sector: 'Automobile' },
  { name: 'ONGC', symbol: 'ONGC', type: 'STOCK', exchange: 'NSE', price: 189.45, sector: 'Oil & Gas' },
  { name: 'Coal India', symbol: 'COALINDIA', type: 'STOCK', exchange: 'NSE', price: 345.70, sector: 'Mining' },
  { name: 'JSW Steel', symbol: 'JSWSTEEL', type: 'STOCK', exchange: 'NSE', price: 789.25, sector: 'Steel' },
  { name: 'Tata Steel', symbol: 'TATASTEEL', type: 'STOCK', exchange: 'NSE', price: 134.80, sector: 'Steel' },
  { name: 'Grasim Industries', symbol: 'GRASIM', type: 'STOCK', exchange: 'NSE', price: 1987.65, sector: 'Cement' },
  
  // Mid Cap Stocks
  { name: 'Zomato', symbol: 'ZOMATO', type: 'STOCK', exchange: 'NSE', price: 156.45, sector: 'Technology' },
  { name: 'Paytm', symbol: 'PAYTM', type: 'STOCK', exchange: 'NSE', price: 678.90, sector: 'Fintech' },
  { name: 'Nykaa', symbol: 'NYKAA', type: 'STOCK', exchange: 'NSE', price: 189.30, sector: 'E-commerce' },
  { name: 'Policy Bazaar', symbol: 'PBFINTECH', type: 'STOCK', exchange: 'NSE', price: 123.75, sector: 'Insurance' },
  { name: 'IRCTC', symbol: 'IRCTC', type: 'STOCK', exchange: 'NSE', price: 789.60, sector: 'Travel' },
  { name: 'HAL', symbol: 'HAL', type: 'STOCK', exchange: 'NSE', price: 3456.20, sector: 'Defense' },
  { name: 'BEL', symbol: 'BEL', type: 'STOCK', exchange: 'NSE', price: 234.90, sector: 'Defense' },
  { name: 'REC Limited', symbol: 'RECLTD', type: 'STOCK', exchange: 'NSE', price: 456.35, sector: 'Finance' },
  { name: 'PFC', symbol: 'PFC', type: 'STOCK', exchange: 'NSE', price: 389.70, sector: 'Finance' },
  { name: 'IOC', symbol: 'IOC', type: 'STOCK', exchange: 'NSE', price: 123.45, sector: 'Oil & Gas' },
  
  // More Large Cap
  { name: 'Bajaj Auto', symbol: 'BAJAJ-AUTO', type: 'STOCK', exchange: 'NSE', price: 8234.50, sector: 'Automobile' },
  { name: 'Hero MotoCorp', symbol: 'HEROMOTOCO', type: 'STOCK', exchange: 'NSE', price: 4567.80, sector: 'Automobile' },
  { name: 'Eicher Motors', symbol: 'EICHERMOT', type: 'STOCK', exchange: 'NSE', price: 3678.90, sector: 'Automobile' },
  { name: 'Britannia', symbol: 'BRITANNIA', type: 'STOCK', exchange: 'NSE', price: 4789.25, sector: 'FMCG' },
  { name: 'Nestle India', symbol: 'NESTLEIND', type: 'STOCK', exchange: 'NSE', price: 23456.70, sector: 'FMCG' },
  { name: 'Pidilite', symbol: 'PIDILITIND', type: 'STOCK', exchange: 'NSE', price: 2678.40, sector: 'Chemicals' },
  { name: 'Siemens', symbol: 'SIEMENS', type: 'STOCK', exchange: 'NSE', price: 3234.90, sector: 'Engineering' },
  { name: 'ABB India', symbol: 'ABB', type: 'STOCK', exchange: 'NSE', price: 4567.30, sector: 'Engineering' },
  { name: 'Havells India', symbol: 'HAVELLS', type: 'STOCK', exchange: 'NSE', price: 1345.60, sector: 'Consumer Durables' },
  { name: 'Voltas', symbol: 'VOLTAS', type: 'STOCK', exchange: 'NSE', price: 1123.75, sector: 'Consumer Durables' },
];

// ─── FOREX PAIRS ──────────────────────────────────────
const forexPairs = [
  { name: 'US Dollar / Indian Rupee', symbol: 'USDINR', type: 'FOREX', exchange: 'FOREX', price: 83.45 },
  { name: 'Euro / Indian Rupee', symbol: 'EURINR', type: 'FOREX', exchange: 'FOREX', price: 90.78 },
  { name: 'British Pound / Indian Rupee', symbol: 'GBPINR', type: 'FOREX', exchange: 'FOREX', price: 105.34 },
  { name: 'Japanese Yen / Indian Rupee', symbol: 'JPYINR', type: 'FOREX', exchange: 'FOREX', price: 0.56 },
  { name: 'Australian Dollar / Indian Rupee', symbol: 'AUDINR', type: 'FOREX', exchange: 'FOREX', price: 54.23 },
  { name: 'Euro / US Dollar', symbol: 'EURUSD', type: 'FOREX', exchange: 'FOREX', price: 1.09 },
  { name: 'British Pound / US Dollar', symbol: 'GBPUSD', type: 'FOREX', exchange: 'FOREX', price: 1.26 },
  { name: 'US Dollar / Japanese Yen', symbol: 'USDJPY', type: 'FOREX', exchange: 'FOREX', price: 149.87 },
  { name: 'Euro / British Pound', symbol: 'EURGBP', type: 'FOREX', exchange: 'FOREX', price: 0.86 },
  { name: 'Australian Dollar / US Dollar', symbol: 'AUDUSD', type: 'FOREX', exchange: 'FOREX', price: 0.65 },
];

// ─── CRYPTO (Optional for future) ──────────────────────────────────────
const cryptoAssets = [
  { name: 'Bitcoin', symbol: 'BTC', type: 'CRYPTO', exchange: 'CRYPTO', price: 43567.80 },
  { name: 'Ethereum', symbol: 'ETH', type: 'CRYPTO', exchange: 'CRYPTO', price: 2345.60 },
  { name: 'Binance Coin', symbol: 'BNB', type: 'CRYPTO', exchange: 'CRYPTO', price: 312.45 },
];

// ─── INDICES ──────────────────────────────────────
const indices = [
  { name: 'NIFTY 50', symbol: 'NIFTY', type: 'INDEX', exchange: 'NSE', price: 24352.00 },
  { name: 'BANK NIFTY', symbol: 'BANKNIFTY', type: 'INDEX', exchange: 'NSE', price: 47890.50 },
  { name: 'SENSEX', symbol: 'SENSEX', type: 'INDEX', exchange: 'BSE', price: 79841.00 },
  { name: 'NIFTY IT', symbol: 'NIFTYIT', type: 'INDEX', exchange: 'NSE', price: 34567.80 },
];

async function seedMarketData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    
    // Clear existing data (optional - comment out to keep existing)
    // await MarketInstrument.deleteMany({});
    // console.log('🗑️  Cleared existing data');
    
    const allInstruments = [
      ...indianStocks,
      ...forexPairs,
      ...cryptoAssets,
      ...indices
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    for (const item of allInstruments) {
      try {
        // Check if already exists
        const existing = await MarketInstrument.findOne({ symbol: item.symbol });
        
        if (existing) {
          console.log(`⏭️  Skipped: ${item.symbol} (already exists)`);
          skipped++;
          continue;
        }
        
        // Create instrument
        const instrument = await MarketInstrument.create({
          ...item,
          open: item.price,
          high: item.price * 1.02,
          low: item.price * 0.98,
          close: item.price,
          isActive: true
        });
        
        console.log(`✅ Added: ${instrument.name} (${instrument.symbol}) - ₹${instrument.price}`);
        inserted++;
      } catch (error) {
        console.error(`❌ Error adding ${item.symbol}:`, error.message);
      }
    }
    
    console.log('\n📊 SEED SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully added: ${inserted} instruments`);
    console.log(`⏭️  Skipped: ${skipped} instruments`);
    console.log(`📈 Total in database: ${await MarketInstrument.countDocuments()}`);
    console.log('\nBreakdown:');
    console.log(`  - Stocks: ${await MarketInstrument.countDocuments({ type: 'STOCK' })}`);
    console.log(`  - Forex: ${await MarketInstrument.countDocuments({ type: 'FOREX' })}`);
    console.log(`  - Crypto: ${await MarketInstrument.countDocuments({ type: 'CRYPTO' })}`);
    console.log(`  - Indices: ${await MarketInstrument.countDocuments({ type: 'INDEX' })}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

// Run seeder
seedMarketData();
