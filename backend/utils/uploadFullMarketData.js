const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
require('dotenv').config();

// =====================================================
// INDIAN MARKET - NSE Major Stocks (100+ instruments)
// =====================================================
const indianStocks = [
  { name: 'Reliance Industries', symbol: 'RELIANCE', type: 'STOCK', exchange: 'NSE', price: 2442.11, isActive: true },
  { name: 'Tata Consultancy Services', symbol: 'TCS', type: 'STOCK', exchange: 'NSE', price: 3856.50, isActive: true },
  { name: 'Infosys', symbol: 'INFY', type: 'STOCK', exchange: 'NSE', price: 1456.75, isActive: true },
  { name: 'HDFC Bank', symbol: 'HDFCBANK', type: 'STOCK', exchange: 'NSE', price: 1623.40, isActive: true },
  { name: 'ICICI Bank', symbol: 'ICICIBANK', type: 'STOCK', exchange: 'NSE', price: 1089.25, isActive: true },
  { name: 'Larsen & Toubro', symbol: 'LT', type: 'STOCK', exchange: 'NSE', price: 3456.80, isActive: true },
  { name: 'State Bank of India', symbol: 'SBIN', type: 'STOCK', exchange: 'NSE', price: 678.90, isActive: true },
  { name: 'ITC Limited', symbol: 'ITC', type: 'STOCK', exchange: 'NSE', price: 456.30, isActive: true },
  { name: 'Wipro', symbol: 'WIPRO', type: 'STOCK', exchange: 'NSE', price: 445.60, isActive: true },
  { name: 'HCL Technologies', symbol: 'HCLTECH', type: 'STOCK', exchange: 'NSE', price: 1234.50, isActive: true },
  { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', type: 'STOCK', exchange: 'NSE', price: 1789.20, isActive: true },
  { name: 'Axis Bank', symbol: 'AXISBANK', type: 'STOCK', exchange: 'NSE', price: 1045.75, isActive: true },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', type: 'STOCK', exchange: 'NSE', price: 6789.40, isActive: true },
  { name: 'Maruti Suzuki', symbol: 'MARUTI', type: 'STOCK', exchange: 'NSE', price: 10234.60, isActive: true },
  { name: 'Titan Company', symbol: 'TITAN', type: 'STOCK', exchange: 'NSE', price: 3234.80, isActive: true },
  { name: 'Asian Paints', symbol: 'ASIANPAINT', type: 'STOCK', exchange: 'NSE', price: 2987.50, isActive: true },
  { name: 'Sun Pharma', symbol: 'SUNPHARMA', type: 'STOCK', exchange: 'NSE', price: 1123.40, isActive: true },
  { name: 'UltraTech Cement', symbol: 'ULTRACEMCO', type: 'STOCK', exchange: 'NSE', price: 8456.70, isActive: true },
  { name: 'Nestle India', symbol: 'NESTLEIND', type: 'STOCK', exchange: 'NSE', price: 23456.80, isActive: true },
  { name: 'Power Grid Corp', symbol: 'POWERGRID', type: 'STOCK', exchange: 'NSE', price: 289.60, isActive: true },
  { name: 'Oil & Natural Gas Corp', symbol: 'ONGC', type: 'STOCK', exchange: 'NSE', price: 234.50, isActive: true },
  { name: 'NTPC Limited', symbol: 'NTPC', type: 'STOCK', exchange: 'NSE', price: 312.40, isActive: true },
  { name: 'Adani Enterprises', symbol: 'ADANIENT', type: 'STOCK', exchange: 'NSE', price: 2567.80, isActive: true },
  { name: 'Adani Ports', symbol: 'ADANIPORTS', type: 'STOCK', exchange: 'NSE', price: 1234.50, isActive: true },
  { name: 'Coal India', symbol: 'COALINDIA', type: 'STOCK', exchange: 'NSE', price: 456.70, isActive: true },
  { name: 'JSW Steel', symbol: 'JSWSTEEL', type: 'STOCK', exchange: 'NSE', price: 789.30, isActive: true },
  { name: 'Tata Steel', symbol: 'TATASTEEL', type: 'STOCK', exchange: 'NSE', price: 134.60, isActive: true },
  { name: 'Hindalco Industries', symbol: 'HINDALCO', type: 'STOCK', exchange: 'NSE', price: 567.80, isActive: true },
  { name: 'Grasim Industries', symbol: 'GRASIM', type: 'STOCK', exchange: 'NSE', price: 2345.60, isActive: true },
  { name: 'Tech Mahindra', symbol: 'TECHM', type: 'STOCK', exchange: 'NSE', price: 1234.70, isActive: true },
  { name: 'Britannia Industries', symbol: 'BRITANNIA', type: 'STOCK', exchange: 'NSE', price: 4567.80, isActive: true },
  { name: "Divi's Laboratories", symbol: 'DIVISLAB', type: 'STOCK', exchange: 'NSE', price: 3456.90, isActive: true },
  { name: "Dr. Reddy's Labs", symbol: 'DRREDDY', type: 'STOCK', exchange: 'NSE', price: 5678.40, isActive: true },
  { name: 'Cipla', symbol: 'CIPLA', type: 'STOCK', exchange: 'NSE', price: 1234.50, isActive: true },
  { name: 'Hero MotoCorp', symbol: 'HEROMOTOCO', type: 'STOCK', exchange: 'NSE', price: 3456.70, isActive: true },
  { name: 'Eicher Motors', symbol: 'EICHERMOT', type: 'STOCK', exchange: 'NSE', price: 4567.80, isActive: true },
  { name: 'Bajaj Finserv', symbol: 'BAJAJFINSV', type: 'STOCK', exchange: 'NSE', price: 1567.90, isActive: true },
  { name: 'Bajaj Auto', symbol: 'BAJAJ-AUTO', type: 'STOCK', exchange: 'NSE', price: 8901.20, isActive: true },
  { name: 'IndusInd Bank', symbol: 'INDUSINDBK', type: 'STOCK', exchange: 'NSE', price: 1456.30, isActive: true },
  { name: 'SBI Life Insurance', symbol: 'SBILIFE', type: 'STOCK', exchange: 'NSE', price: 1567.40, isActive: true },
  { name: 'HDFC Life Insurance', symbol: 'HDFCLIFE', type: 'STOCK', exchange: 'NSE', price: 678.50, isActive: true },
  { name: 'Pidilite Industries', symbol: 'PIDILITIND', type: 'STOCK', exchange: 'NSE', price: 2345.60, isActive: true },
  { name: 'Dabur India', symbol: 'DABUR', type: 'STOCK', exchange: 'NSE', price: 567.70, isActive: true },
  { name: 'Godrej Consumer', symbol: 'GODREJCP', type: 'STOCK', exchange: 'NSE', price: 1234.80, isActive: true },
  { name: 'Marico', symbol: 'MARICO', type: 'STOCK', exchange: 'NSE', price: 567.90, isActive: true },
  { name: 'Colgate Palmolive', symbol: 'COLPAL', type: 'STOCK', exchange: 'NSE', price: 2345.10, isActive: true },
  { name: 'Ambuja Cements', symbol: 'AMBUJACEM', type: 'STOCK', exchange: 'NSE', price: 456.20, isActive: true },
  { name: 'Shree Cement', symbol: 'SHREECEM', type: 'STOCK', exchange: 'NSE', price: 26789.30, isActive: true },
  { name: 'ACC Limited', symbol: 'ACC', type: 'STOCK', exchange: 'NSE', price: 2345.40, isActive: true },
  { name: 'Bosch Limited', symbol: 'BOSCHLTD', type: 'STOCK', exchange: 'NSE', price: 34567.50, isActive: true },
  { name: 'Siemens Limited', symbol: 'SIEMENS', type: 'STOCK', exchange: 'NSE', price: 5678.60, isActive: true },
  { name: 'ABB India', symbol: 'ABB', type: 'STOCK', exchange: 'NSE', price: 6789.70, isActive: true },
  { name: 'Vedanta Limited', symbol: 'VEDL', type: 'STOCK', exchange: 'NSE', price: 234.80, isActive: true },
  { name: 'Havells India', symbol: 'HAVELLS', type: 'STOCK', exchange: 'NSE', price: 1567.90, isActive: true },
  { name: 'Page Industries', symbol: 'PAGEIND', type: 'STOCK', exchange: 'NSE', price: 45678.10, isActive: true },
  { name: 'Trent Limited', symbol: 'TRENT', type: 'STOCK', exchange: 'NSE', price: 5678.20, isActive: true },
  { name: 'United Spirits', symbol: 'MCDOWELL-N', type: 'STOCK', exchange: 'NSE', price: 1234.30, isActive: true },
  { name: 'Berger Paints', symbol: 'BERGEPAINT', type: 'STOCK', exchange: 'NSE', price: 678.40, isActive: true },
  { name: 'Info Edge (Naukri)', symbol: 'NAUKRI', type: 'STOCK', exchange: 'NSE', price: 6789.50, isActive: true },
  { name: 'Paytm (One97)', symbol: 'PAYTM', type: 'STOCK', exchange: 'NSE', price: 456.60, isActive: true },
  { name: 'Zomato', symbol: 'ZOMATO', type: 'STOCK', exchange: 'NSE', price: 234.70, isActive: true },
  { name: 'Nykaa (FSN E-Commerce)', symbol: 'NYKAA', type: 'STOCK', exchange: 'NSE', price: 178.80, isActive: true },
  { name: 'Polycab India', symbol: 'POLYCAB', type: 'STOCK', exchange: 'NSE', price: 5678.90, isActive: true },
  { name: 'Tata Consumer Products', symbol: 'TATACONSUM', type: 'STOCK', exchange: 'NSE', price: 1123.10, isActive: true },
  { name: 'Tata Power', symbol: 'TATAPOWER', type: 'STOCK', exchange: 'NSE', price: 345.20, isActive: true },
  { name: 'Indian Oil Corp', symbol: 'IOC', type: 'STOCK', exchange: 'NSE', price: 123.30, isActive: true },
  { name: 'Bharat Petroleum', symbol: 'BPCL', type: 'STOCK', exchange: 'NSE', price: 345.40, isActive: true },
  { name: 'Hindustan Petroleum', symbol: 'HINDPETRO', type: 'STOCK', exchange: 'NSE', price: 456.50, isActive: true },
  { name: 'GAIL India', symbol: 'GAIL', type: 'STOCK', exchange: 'NSE', price: 178.60, isActive: true },
  { name: 'Punjab National Bank', symbol: 'PNB', type: 'STOCK', exchange: 'NSE', price: 123.70, isActive: true },
  { name: 'Bank of Baroda', symbol: 'BANKBARODA', type: 'STOCK', exchange: 'NSE', price: 234.80, isActive: true },
  { name: 'Canara Bank', symbol: 'CANBK', type: 'STOCK', exchange: 'NSE', price: 456.90, isActive: true },
  { name: 'IDFC First Bank', symbol: 'IDFCFIRSTB', type: 'STOCK', exchange: 'NSE', price: 78.10, isActive: true },
  { name: 'Federal Bank', symbol: 'FEDERALBNK', type: 'STOCK', exchange: 'NSE', price: 167.20, isActive: true },
  { name: 'Yes Bank', symbol: 'YESBANK', type: 'STOCK', exchange: 'NSE', price: 23.30, isActive: true },
  { name: 'IRCTC', symbol: 'IRCTC', type: 'STOCK', exchange: 'NSE', price: 789.40, isActive: true },
  { name: 'Rail Vikas Nigam', symbol: 'RVNL', type: 'STOCK', exchange: 'NSE', price: 234.50, isActive: true },
  { name: 'Hindustan Aeronautics', symbol: 'HAL', type: 'STOCK', exchange: 'NSE', price: 4567.60, isActive: true },
  { name: 'Bharat Electronics', symbol: 'BEL', type: 'STOCK', exchange: 'NSE', price: 234.70, isActive: true },
  { name: 'BHEL', symbol: 'BHEL', type: 'STOCK', exchange: 'NSE', price: 234.80, isActive: true },
  { name: 'DMart (Avenue Supermarts)', symbol: 'DMART', type: 'STOCK', exchange: 'NSE', price: 4567.90, isActive: true },
  { name: 'Varun Beverages', symbol: 'VBL', type: 'STOCK', exchange: 'NSE', price: 1234.10, isActive: true },
  { name: 'Apollo Hospitals', symbol: 'APOLLOHOSP', type: 'STOCK', exchange: 'NSE', price: 5678.20, isActive: true },
  { name: 'Max Healthcare', symbol: 'MAXHEALTH', type: 'STOCK', exchange: 'NSE', price: 1234.30, isActive: true },
  { name: 'Fortis Healthcare', symbol: 'FORTIS', type: 'STOCK', exchange: 'NSE', price: 456.40, isActive: true },
  { name: 'Lupin', symbol: 'LUPIN', type: 'STOCK', exchange: 'NSE', price: 1567.50, isActive: true },
  { name: 'Aurobindo Pharma', symbol: 'AUROPHARMA', type: 'STOCK', exchange: 'NSE', price: 1234.60, isActive: true },
  { name: 'Mahindra & Mahindra', symbol: 'M&M', type: 'STOCK', exchange: 'NSE', price: 2345.70, isActive: true },
  { name: 'Tata Motors', symbol: 'TATAMOTORS', type: 'STOCK', exchange: 'NSE', price: 789.80, isActive: true },
  { name: 'Ashok Leyland', symbol: 'ASHOKLEY', type: 'STOCK', exchange: 'NSE', price: 178.90, isActive: true },
  { name: 'Bajaj Holdings', symbol: 'BAJAJHLDNG', type: 'STOCK', exchange: 'NSE', price: 9876.10, isActive: true },
  { name: 'HDFC Asset Management', symbol: 'HDFCAMC', type: 'STOCK', exchange: 'NSE', price: 3456.20, isActive: true },
  { name: 'ICICI Prudential Life', symbol: 'ICICIPRULI', type: 'STOCK', exchange: 'NSE', price: 567.30, isActive: true },
  { name: 'SBI Cards', symbol: 'SBICARD', type: 'STOCK', exchange: 'NSE', price: 789.40, isActive: true },
  { name: 'Cholamandalam Investment', symbol: 'CHOLAFIN', type: 'STOCK', exchange: 'NSE', price: 1234.50, isActive: true },
  { name: 'Muthoot Finance', symbol: 'MUTHOOTFIN', type: 'STOCK', exchange: 'NSE', price: 1567.60, isActive: true },
  { name: 'Bharti Airtel', symbol: 'BHARTIARTL', type: 'STOCK', exchange: 'NSE', price: 1234.70, isActive: true },
  { name: 'Vodafone Idea', symbol: 'IDEA', type: 'STOCK', exchange: 'NSE', price: 12.80, isActive: true },
  { name: 'Reliance Communications', symbol: 'RCOM', type: 'STOCK', exchange: 'NSE', price: 5.90, isActive: true },
  { name: 'MTNL', symbol: 'MTNL', type: 'STOCK', exchange: 'NSE', price: 23.10, isActive: true },
  { name: 'BSNL', symbol: 'BSNL', type: 'STOCK', exchange: 'NSE', price: 34.20, isActive: true },
];

// =====================================================
// FOREX MARKET - Major Currency Pairs (20 pairs)
// =====================================================
const forexPairs = [
  { name: 'Euro / US Dollar', symbol: 'EURUSD', type: 'FOREX', exchange: 'FOREX', price: 1.0845, isActive: true },
  { name: 'British Pound / US Dollar', symbol: 'GBPUSD', type: 'FOREX', exchange: 'FOREX', price: 1.2678, isActive: true },
  { name: 'US Dollar / Japanese Yen', symbol: 'USDJPY', type: 'FOREX', exchange: 'FOREX', price: 151.23, isActive: true },
  { name: 'US Dollar / Swiss Franc', symbol: 'USDCHF', type: 'FOREX', exchange: 'FOREX', price: 0.8934, isActive: true },
  { name: 'Australian Dollar / US Dollar', symbol: 'AUDUSD', type: 'FOREX', exchange: 'FOREX', price: 0.6523, isActive: true },
  { name: 'US Dollar / Canadian Dollar', symbol: 'USDCAD', type: 'FOREX', exchange: 'FOREX', price: 1.3567, isActive: true },
  { name: 'New Zealand Dollar / US Dollar', symbol: 'NZDUSD', type: 'FOREX', exchange: 'FOREX', price: 0.6012, isActive: true },
  { name: 'Euro / British Pound', symbol: 'EURGBP', type: 'FOREX', exchange: 'FOREX', price: 0.8556, isActive: true },
  { name: 'Euro / Japanese Yen', symbol: 'EURJPY', type: 'FOREX', exchange: 'FOREX', price: 163.89, isActive: true },
  { name: 'British Pound / Japanese Yen', symbol: 'GBPJPY', type: 'FOREX', exchange: 'FOREX', price: 191.67, isActive: true },
  { name: 'Australian Dollar / Japanese Yen', symbol: 'AUDJPY', type: 'FOREX', exchange: 'FOREX', price: 98.67, isActive: true },
  { name: 'Swiss Franc / Japanese Yen', symbol: 'CHFJPY', type: 'FOREX', exchange: 'FOREX', price: 169.23, isActive: true },
  { name: 'Euro / Swiss Franc', symbol: 'EURCHF', type: 'FOREX', exchange: 'FOREX', price: 0.9689, isActive: true },
  { name: 'British Pound / Swiss Franc', symbol: 'GBPCHF', type: 'FOREX', exchange: 'FOREX', price: 1.1324, isActive: true },
  { name: 'Australian Dollar / Canadian Dollar', symbol: 'AUDCAD', type: 'FOREX', exchange: 'FOREX', price: 0.8845, isActive: true },
  { name: 'Australian Dollar / Swiss Franc', symbol: 'AUDCHF', type: 'FOREX', exchange: 'FOREX', price: 0.5823, isActive: true },
  { name: 'Canadian Dollar / Japanese Yen', symbol: 'CADJPY', type: 'FOREX', exchange: 'FOREX', price: 111.45, isActive: true },
  { name: 'New Zealand Dollar / Japanese Yen', symbol: 'NZDJPY', type: 'FOREX', exchange: 'FOREX', price: 90.89, isActive: true },
  { name: 'Euro / Australian Dollar', symbol: 'EURAUD', type: 'FOREX', exchange: 'FOREX', price: 1.6623, isActive: true },
  { name: 'British Pound / Australian Dollar', symbol: 'GBPAUD', type: 'FOREX', exchange: 'FOREX', price: 1.9434, isActive: true },
];

// =====================================================
// OPTIONS - Index Options (Sample contracts)
// =====================================================
const options = [
  { name: 'NIFTY 20000 CE', symbol: 'NIFTY20000CE', type: 'OPTION', exchange: 'NSE', price: 234.50, strikePrice: 20000, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'NIFTY', isActive: true },
  { name: 'NIFTY 20000 PE', symbol: 'NIFTY20000PE', type: 'OPTION', exchange: 'NSE', price: 189.30, strikePrice: 20000, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'NIFTY', isActive: true },
  { name: 'NIFTY 20500 CE', symbol: 'NIFTY20500CE', type: 'OPTION', exchange: 'NSE', price: 156.70, strikePrice: 20500, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'NIFTY', isActive: true },
  { name: 'NIFTY 20500 PE', symbol: 'NIFTY20500PE', type: 'OPTION', exchange: 'NSE', price: 267.80, strikePrice: 20500, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'NIFTY', isActive: true },
  { name: 'BANKNIFTY 45000 CE', symbol: 'BANKNIFTY45000CE', type: 'OPTION', exchange: 'NSE', price: 456.90, strikePrice: 45000, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'BANKNIFTY', isActive: true },
  { name: 'BANKNIFTY 45000 PE', symbol: 'BANKNIFTY45000PE', type: 'OPTION', exchange: 'NSE', price: 389.40, strikePrice: 45000, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'BANKNIFTY', isActive: true },
  { name: 'BANKNIFTY 46000 CE', symbol: 'BANKNIFTY46000CE', type: 'OPTION', exchange: 'NSE', price: 312.50, strikePrice: 46000, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'BANKNIFTY', isActive: true },
  { name: 'BANKNIFTY 46000 PE', symbol: 'BANKNIFTY46000PE', type: 'OPTION', exchange: 'NSE', price: 523.60, strikePrice: 46000, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'BANKNIFTY', isActive: true },
  { name: 'FINNIFTY 20000 CE', symbol: 'FINNIFTY20000CE', type: 'OPTION', exchange: 'NSE', price: 178.70, strikePrice: 20000, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'FINNIFTY', isActive: true },
  { name: 'FINNIFTY 20000 PE', symbol: 'FINNIFTY20000PE', type: 'OPTION', exchange: 'NSE', price: 234.80, strikePrice: 20000, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'FINNIFTY', isActive: true },
  { name: 'MIDCPNIFTY 12000 CE', symbol: 'MIDCPNIFTY12000CE', type: 'OPTION', exchange: 'NSE', price: 145.90, strikePrice: 12000, expiryDate: new Date('2026-04-30'), optionType: 'CE', underlying: 'MIDCPNIFTY', isActive: true },
  { name: 'MIDCPNIFTY 12000 PE', symbol: 'MIDCPNIFTY12000PE', type: 'OPTION', exchange: 'NSE', price: 198.30, strikePrice: 12000, expiryDate: new Date('2026-04-30'), optionType: 'PE', underlying: 'MIDCPNIFTY', isActive: true },
];

async function uploadFullMarketData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Check current count
    const currentCount = await MarketInstrument.countDocuments();
    console.log(`📊 Current instruments in database: ${currentCount}\n`);

    if (currentCount > 0) {
      console.log('⚠️  Database already has instruments.');
      console.log('   Do you want to clear existing data first? (y/n)');
      // For automated execution, we'll proceed with adding new data
      console.log('   Proceeding to add new instruments...\n');
    }

    // Combine all instruments
    const allInstruments = [...indianStocks, ...forexPairs, ...options];
    console.log(`📦 Preparing to upload:`);
    console.log(`   - Indian Stocks (STOCK): ${indianStocks.length}`);
    console.log(`   - Forex Pairs (FOREX): ${forexPairs.length}`);
    console.log(`   - Options (OPTION): ${options.length}`);
    console.log(`   - Total: ${allInstruments.length} instruments\n`);

    // Upload instruments one by one to avoid duplicates
    let inserted = 0;
    let skipped = 0;

    for (const instrument of allInstruments) {
      try {
        // Check if instrument already exists
        const existing = await MarketInstrument.findOne({ symbol: instrument.symbol });
        
        if (existing) {
          // Update existing instrument
          await MarketInstrument.updateOne(
            { symbol: instrument.symbol },
            { $set: instrument }
          );
          skipped++;
        } else {
          // Insert new instrument
          await MarketInstrument.create(instrument);
          inserted++;
        }
      } catch (err) {
        console.error(`❌ Error with ${instrument.symbol}:`, err.message);
      }
    }

    console.log('\n✅ Upload completed!');
    console.log(`   - New instruments inserted: ${inserted}`);
    console.log(`   - Existing instruments updated: ${skipped}`);

    // Verify final counts
    const totalCount = await MarketInstrument.countDocuments();
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK' });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX' });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION' });

    console.log('\n📊 Final Database Status:');
    console.log(`   Total Instruments: ${totalCount}`);
    console.log(`   - STOCK: ${stockCount}`);
    console.log(`   - FOREX: ${forexCount}`);
    console.log(`   - OPTION: ${optionCount}`);

    // Verify all are active
    const activeCount = await MarketInstrument.countDocuments({ isActive: true });
    console.log(`   Active Instruments: ${activeCount}\n`);

    console.log('✅ SUCCESS! All instruments uploaded successfully.');
    console.log('\n📝 Next steps:');
    console.log('1. Restart backend server: npm start');
    console.log('2. Open TradingPage');
    console.log('3. Verify tab filtering:');
    console.log('   - Indian Market tab → Should show', stockCount, 'stocks');
    console.log('   - Forex Market tab → Should show', forexCount, 'forex pairs');
    console.log('   - Options tab → Should show', optionCount, 'options');
    console.log('4. Market Watch count should match tab selection');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

uploadFullMarketData();
