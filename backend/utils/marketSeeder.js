const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');
const logger = require('./logger');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Seeder] MongoDB connected');
  } catch (err) {
    logger.error('[Seeder] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Helper: Generate random number in range
function random(min, max, decimals = 2) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

// Helper: Generate OHLC candle data
function generateCandles(basePrice, count = 50, interval = '1min') {
  const candles = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * getIntervalMs(interval));
    
    const volatility = basePrice * 0.02; // 2% volatility
    const open = currentPrice;
    const change = random(-volatility, volatility);
    const close = open + change;
    const high = Math.max(open, close) + random(0, volatility * 0.5);
    const low = Math.min(open, close) - random(0, volatility * 0.5);
    const volume = Math.floor(random(100000, 5000000));
    
    candles.push({
      timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }
  
  return candles;
}

// Helper: Get interval in milliseconds
function getIntervalMs(interval) {
  const intervals = {
    '1min': 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000
  };
  return intervals[interval] || 60 * 1000;
}

// ─── INDIAN STOCKS DATA ──────────────────────────────────────────────
const indianStocks = [
  { name: 'Reliance Industries', symbol: 'RELIANCE', sector: 'Oil & Gas', basePrice: 2450 },
  { name: 'Tata Consultancy Services', symbol: 'TCS', sector: 'IT', basePrice: 3850 },
  { name: 'HDFC Bank', symbol: 'HDFCBANK', sector: 'Banking', basePrice: 1620 },
  { name: 'Infosys', symbol: 'INFY', sector: 'IT', basePrice: 1520 },
  { name: 'ICICI Bank', symbol: 'ICICIBANK', sector: 'Banking', basePrice: 1050 },
  { name: 'State Bank of India', symbol: 'SBIN', sector: 'Banking', basePrice: 690 },
  { name: 'ITC Limited', symbol: 'ITC', sector: 'FMCG', basePrice: 490 },
  { name: 'Larsen & Toubro', symbol: 'LT', sector: 'Engineering', basePrice: 3650 },
  { name: 'Axis Bank', symbol: 'AXISBANK', sector: 'Banking', basePrice: 1290 },
  { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', sector: 'Banking', basePrice: 1630 },
  { name: 'Maruti Suzuki', symbol: 'MARUTI', sector: 'Automobile', basePrice: 10450 },
  { name: 'Asian Paints', symbol: 'ASIANPAINT', sector: 'FMCG', basePrice: 2940 },
  { name: 'Sun Pharma', symbol: 'SUNPHARMA', sector: 'Pharma', basePrice: 1450 },
  { name: 'Titan Company', symbol: 'TITAN', sector: 'FMCG', basePrice: 3300 },
  { name: 'UltraTech Cement', symbol: 'ULTRACEMCO', sector: 'Cement', basePrice: 9380 },
  { name: 'Wipro', symbol: 'WIPRO', sector: 'IT', basePrice: 575 },
  { name: 'NTPC', symbol: 'NTPC', sector: 'Power', basePrice: 297 },
  { name: 'Power Grid Corporation', symbol: 'POWERGRID', sector: 'Power', basePrice: 258 },
  { name: 'ONGC', symbol: 'ONGC', sector: 'Oil & Gas', basePrice: 247 },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', sector: 'Finance', basePrice: 7420 },
  { name: 'Adani Enterprises', symbol: 'ADANIENT', sector: 'Diversified', basePrice: 2850 },
  { name: 'Adani Ports', symbol: 'ADANIPORTS', sector: 'Infrastructure', basePrice: 1280 },
  { name: 'HCL Technologies', symbol: 'HCLTECH', sector: 'IT', basePrice: 1380 },
  { name: 'Tech Mahindra', symbol: 'TECHM', sector: 'IT', basePrice: 1650 },
  { name: 'JSW Steel', symbol: 'JSWSTEEL', sector: 'Metal', basePrice: 890 },
  { name: 'Tata Steel', symbol: 'TATASTEEL', sector: 'Metal', basePrice: 145 },
  { name: 'Coal India', symbol: 'COALINDIA', sector: 'Mining', basePrice: 420 },
  { name: "Dr. Reddy's Laboratories", symbol: 'DRREDDY', sector: 'Pharma', basePrice: 5850 },
  { name: 'Divi\'s Laboratories', symbol: 'DIVISLAB', sector: 'Pharma', basePrice: 3650 },
  { name: 'Eicher Motors', symbol: 'EICHERMOT', sector: 'Automobile', basePrice: 4250 },
  { name: 'Hero MotoCorp', symbol: 'HEROMOTOCO', sector: 'Automobile', basePrice: 4580 },
  { name: 'Britannia Industries', symbol: 'BRITANNIA', sector: 'FMCG', basePrice: 4920 },
  { name: 'Grasim Industries', symbol: 'GRASIM', sector: 'Diversified', basePrice: 2450 },
  { name: 'Hindalco Industries', symbol: 'HINDALCO', sector: 'Metal', basePrice: 580 },
  { name: 'IndusInd Bank', symbol: 'INDUSINDBK', sector: 'Banking', basePrice: 1450 },
  { name: 'Bajaj Finserv', symbol: 'BAJAJFINSV', sector: 'Finance', basePrice: 1680 },
  { name: 'Bajaj Auto', symbol: 'BAJAJ-AUTO', sector: 'Automobile', basePrice: 8950 },
  { name: 'Apollo Hospitals', symbol: 'APOLLOHOSP', sector: 'Healthcare', basePrice: 6250 },
  { name: 'Cipla', symbol: 'CIPLA', sector: 'Pharma', basePrice: 1480 },
  { name: 'SBI Life Insurance', symbol: 'SBILIFE', sector: 'Insurance', basePrice: 1520 },
  { name: 'UPL Limited', symbol: 'UPL', sector: 'Agrochemicals', basePrice: 620 },
  { name: 'Pidilite Industries', symbol: 'PIDILITIND', sector: 'Chemicals', basePrice: 2850 },
  { name: 'Dabur India', symbol: 'DABUR', sector: 'FMCG', basePrice: 520 },
  { name: 'Ambuja Cements', symbol: 'AMBUJACEM', sector: 'Cement', basePrice: 580 },
  { name: 'Godrej Consumer', symbol: 'GODREJCP', sector: 'FMCG', basePrice: 1180 },
  { name: 'Tata Motors', symbol: 'TATAMOTORS', sector: 'Automobile', basePrice: 780 },
  { name: 'Mahindra & Mahindra', symbol: 'M&M', sector: 'Automobile', basePrice: 2850 },
  { name: 'Hindustan Unilever', symbol: 'HINDUNILVR', sector: 'FMCG', basePrice: 2580 },
  { name: 'Bharti Airtel', symbol: 'BHARTIARTL', sector: 'Telecom', basePrice: 1450 },
  { name: 'Nestle India', symbol: 'NESTLEIND', sector: 'FMCG', basePrice: 24500 },
  { name: 'HDFC Life Insurance', symbol: 'HDFCLIFE', sector: 'Insurance', basePrice: 620 },
  { name: 'ICICI Prudential Life', symbol: 'ICICIPRULI', sector: 'Insurance', basePrice: 580 },
  { name: 'Tata Consumer Products', symbol: 'TATACONSUM', sector: 'FMCG', basePrice: 1180 },
  { name: 'Siemens', symbol: 'SIEMENS', sector: 'Engineering', basePrice: 6850 },
  { name: 'ABB India', symbol: 'ABB', sector: 'Engineering', basePrice: 7250 },
  { name: 'DLF Limited', symbol: 'DLF', sector: 'Real Estate', basePrice: 850 },
  { name: 'Godrej Properties', symbol: 'GODREJPROP', sector: 'Real Estate', basePrice: 2650 },
  { name: 'Indian Oil Corporation', symbol: 'IOC', sector: 'Oil & Gas', basePrice: 185 },
  { name: 'BPCL', symbol: 'BPCL', sector: 'Oil & Gas', basePrice: 320 },
  { name: 'HPCL', symbol: 'HPCL', sector: 'Oil & Gas', basePrice: 385 },
  { name: 'GAIL India', symbol: 'GAIL', sector: 'Oil & Gas', basePrice: 195 },
  { name: 'Steel Authority of India', symbol: 'SAIL', sector: 'Metal', basePrice: 125 },
  { name: 'Vedanta', symbol: 'VEDL', sector: 'Metal', basePrice: 420 },
  { name: 'Hindalco Industries', symbol: 'HINDALCO', sector: 'Metal', basePrice: 580 },
  { name: 'Adani Green Energy', symbol: 'ADANIGREEN', sector: 'Energy', basePrice: 1850 },
  { name: 'Adani Total Gas', symbol: 'ATGL', sector: 'Energy', basePrice: 780 },
  { name: 'Torrent Power', symbol: 'TORNTPOWER', sector: 'Power', basePrice: 1450 },
  { name: 'Tata Power', symbol: 'TATAPOWER', sector: 'Power', basePrice: 385 },
  { name: 'JSW Energy', symbol: 'JSWENERGY', sector: 'Power', basePrice: 520 },
  { name: 'NHPC', symbol: 'NHPC', sector: 'Power', basePrice: 85 },
  { name: 'IRCTC', symbol: 'IRCTC', sector: 'Services', basePrice: 850 },
  { name: 'Zomato', symbol: 'ZOMATO', sector: 'Technology', basePrice: 245 },
  { name: 'Paytm', symbol: 'PAYTM', sector: 'Technology', basePrice: 950 },
  { name: 'Policy Bazaar', symbol: 'PBFINTECH', sector: 'Technology', basePrice: 1850 },
  { name: 'Nykaa', symbol: 'NYKAA', sector: 'Retail', basePrice: 185 },
  { name: 'Delhivery', symbol: 'DELHIVERY', sector: 'Logistics', basePrice: 385 },
  { name: 'Info Edge', symbol: 'NAUKRI', sector: 'Technology', basePrice: 7850 },
  { name: 'Persistent Systems', symbol: 'PERSISTENT', sector: 'IT', basePrice: 5850 },
  { name: 'LTIMindtree', symbol: 'LTIM', sector: 'IT', basePrice: 5650 },
  { name: 'Mphasis', symbol: 'MPHASIS', sector: 'IT', basePrice: 2850 },
  { name: 'Coforge', symbol: 'COFORGE', sector: 'IT', basePrice: 6250 },
  { name: 'L&T Technology Services', symbol: 'LTTS', sector: 'IT', basePrice: 5150 },
  { name: 'Tata Elxsi', symbol: 'TATAELXSI', sector: 'IT', basePrice: 7850 },
  { name: 'Biocon', symbol: 'BIOCON', sector: 'Pharma', basePrice: 285 },
  { name: 'Aurobindo Pharma', symbol: 'AUROPHARMA', sector: 'Pharma', basePrice: 1150 },
  { name: 'Lupin', symbol: 'LUPIN', sector: 'Pharma', basePrice: 1850 },
  { name: 'Torrent Pharmaceuticals', symbol: 'TORNTPHARM', sector: 'Pharma', basePrice: 2650 },
  { name: 'Alkem Laboratories', symbol: 'ALKEM', sector: 'Pharma', basePrice: 5250 },
  { name: 'Abbott India', symbol: 'ABBOTINDIA', sector: 'Pharma', basePrice: 28500 },
  { name: 'Max Healthcare', symbol: 'MAXHEALTH', sector: 'Healthcare', basePrice: 1050 },
  { name: 'Fortis Healthcare', symbol: 'FORTIS', sector: 'Healthcare', basePrice: 485 },
  { name: 'Narayana Health', symbol: 'NH', sector: 'Healthcare', basePrice: 1250 },
  { name: 'Berger Paints', symbol: 'BERGEPAINT', sector: 'FMCG', basePrice: 580 },
  { name: 'Kansai Nerolac', symbol: 'KANSAINER', sector: 'FMCG', basePrice: 285 },
  { name: 'Havells India', symbol: 'HAVELLS', sector: 'Consumer Durables', basePrice: 1650 },
  { name: 'Voltas', symbol: 'VOLTAS', sector: 'Consumer Durables', basePrice: 1450 },
  { name: 'Blue Star', symbol: 'BLUESTARCO', sector: 'Consumer Durables', basePrice: 1850 },
  { name: 'Crompton Greaves', symbol: 'CROMPTON', sector: 'Consumer Durables', basePrice: 385 },
  { name: 'Bajaj Electricals', symbol: 'BAJAJELEC', sector: 'Consumer Durables', basePrice: 850 },
  { name: 'United Spirits', symbol: 'MCDOWELL-N', sector: 'FMCG', basePrice: 1150 },
  { name: 'United Breweries', symbol: 'UBL', sector: 'FMCG', basePrice: 2050 },
  { name: 'Radico Khaitan', symbol: 'RADICO', sector: 'FMCG', basePrice: 2250 },
  { name: 'Colgate-Palmolive', symbol: 'COLPAL', sector: 'FMCG', basePrice: 2650 },
  { name: 'Procter & Gamble Hygiene', symbol: 'PGHH', sector: 'FMCG', basePrice: 16500 },
  { name: 'Gillette India', symbol: 'GILLETTE', sector: 'FMCG', basePrice: 6850 },
  { name: 'Marico', symbol: 'MARICO', sector: 'FMCG', basePrice: 580 },
  { name: 'Emami', symbol: 'EMAMILTD', sector: 'FMCG', basePrice: 520 },
  { name: 'Jyothy Labs', symbol: 'JYOTHYLAB', sector: 'FMCG', basePrice: 385 },
  { name: 'Varun Beverages', symbol: 'VBL', sector: 'FMCG', basePrice: 1650 },
  { name: 'Page Industries', symbol: 'PAGEIND', sector: 'Textiles', basePrice: 42500 },
  { name: 'KPR Mill', symbol: 'KPRMILL', sector: 'Textiles', basePrice: 950 },
  { name: 'Raymond', symbol: 'RAYMOND', sector: 'Textiles', basePrice: 3850 },
  { name: 'Arvind', symbol: 'ARVIND', sector: 'Textiles', basePrice: 385 },
  { name: 'Welspun India', symbol: 'WELSPUNIND', sector: 'Textiles', basePrice: 185 },
  { name: 'Ashok Leyland', symbol: 'ASHOKLEY', sector: 'Automobile', basePrice: 215 },
  { name: 'Eicher Motors', symbol: 'EICHERMOT', sector: 'Automobile', basePrice: 4250 },
  { name: 'TVS Motor', symbol: 'TVSMOTOR', sector: 'Automobile', basePrice: 2450 },
  { name: 'Bosch', symbol: 'BOSCHLTD', sector: 'Automobile', basePrice: 32500 },
  { name: 'Motherson Sumi', symbol: 'MOTHERSON', sector: 'Automobile', basePrice: 185 },
  { name: 'Exide Industries', symbol: 'EXIDEIND', sector: 'Automobile', basePrice: 485 },
  { name: 'Amara Raja Batteries', symbol: 'AMARAJABAT', sector: 'Automobile', basePrice: 850 },
  { name: 'Apollo Tyres', symbol: 'APOLLOTYRE', sector: 'Automobile', basePrice: 485 },
  { name: 'MRF', symbol: 'MRF', sector: 'Automobile', basePrice: 125000 },
  { name: 'CEAT', symbol: 'CEATLTD', sector: 'Automobile', basePrice: 3250 },
  { name: 'JK Tyre', symbol: 'JKTYRE', sector: 'Automobile', basePrice: 385 },
  { name: 'Sundram Fasteners', symbol: 'SUNDRMFAST', sector: 'Auto Components', basePrice: 1150 },
  { name: 'Bharat Forge', symbol: 'BHARATFORG', sector: 'Auto Components', basePrice: 1250 },
  { name: 'Cummins India', symbol: 'CUMMINSIND', sector: 'Engineering', basePrice: 3250 },
  { name: 'Thermax', symbol: 'THERMAX', sector: 'Engineering', basePrice: 3850 },
  { name: 'Kirloskar Oil Engines', symbol: 'KIRLOSENG', sector: 'Engineering', basePrice: 1850 },
  { name: 'Voltamp Transformers', symbol: 'VOLTAMP', sector: 'Engineering', basePrice: 8500 },
  { name: 'Hitachi Energy', symbol: 'POWERINDIA', sector: 'Engineering', basePrice: 28500 },
];

// ─── FOREX PAIRS DATA ────────────────────────────────────────────────
const forexPairs = [
  // Major Pairs
  { name: 'Euro / US Dollar', symbol: 'EURUSD', basePrice: 1.0850 },
  { name: 'British Pound / US Dollar', symbol: 'GBPUSD', basePrice: 1.2620 },
  { name: 'US Dollar / Japanese Yen', symbol: 'USDJPY', basePrice: 150.80 },
  { name: 'US Dollar / Swiss Franc', symbol: 'USDCHF', basePrice: 0.8910 },
  { name: 'Australian Dollar / US Dollar', symbol: 'AUDUSD', basePrice: 0.6560 },
  { name: 'US Dollar / Canadian Dollar', symbol: 'USDCAD', basePrice: 1.3520 },
  { name: 'New Zealand Dollar / US Dollar', symbol: 'NZDUSD', basePrice: 0.6105 },
  
  // Cross Pairs
  { name: 'Euro / British Pound', symbol: 'EURGBP', basePrice: 0.8580 },
  { name: 'Euro / Japanese Yen', symbol: 'EURJPY', basePrice: 164.00 },
  { name: 'British Pound / Japanese Yen', symbol: 'GBPJPY', basePrice: 190.70 },
  { name: 'Australian Dollar / Japanese Yen', symbol: 'AUDJPY', basePrice: 98.90 },
  { name: 'Swiss Franc / Japanese Yen', symbol: 'CHFJPY', basePrice: 169.30 },
  { name: 'Canadian Dollar / Japanese Yen', symbol: 'CADJPY', basePrice: 111.50 },
  { name: 'Euro / Australian Dollar', symbol: 'EURAUD', basePrice: 1.6540 },
  { name: 'Euro / Canadian Dollar', symbol: 'EURCAD', basePrice: 1.4670 },
  { name: 'Euro / Swiss Franc', symbol: 'EURCHF', basePrice: 0.9670 },
  { name: 'Euro / New Zealand Dollar', symbol: 'EURNZD', basePrice: 1.7780 },
  { name: 'British Pound / Australian Dollar', symbol: 'GBPAUD', basePrice: 1.9240 },
  { name: 'British Pound / Canadian Dollar', symbol: 'GBPCAD', basePrice: 1.7070 },
  { name: 'British Pound / Swiss Franc', symbol: 'GBPCHF', basePrice: 1.1250 },
  { name: 'Australian Dollar / Canadian Dollar', symbol: 'AUDCAD', basePrice: 0.8870 },
  { name: 'Australian Dollar / Swiss Franc', symbol: 'AUDCHF', basePrice: 0.5840 },
  { name: 'New Zealand Dollar / Japanese Yen', symbol: 'NZDJPY', basePrice: 92.00 },
  { name: 'New Zealand Dollar / Canadian Dollar', symbol: 'NZDCAD', basePrice: 0.8250 },
  { name: 'New Zealand Dollar / Swiss Franc', symbol: 'NZDCHF', basePrice: 0.5440 },
  
  // Exotic Pairs
  { name: 'US Dollar / Indian Rupee', symbol: 'USDINR', basePrice: 83.20 },
  { name: 'US Dollar / UAE Dirham', symbol: 'USDAED', basePrice: 3.6725 },
  { name: 'US Dollar / Singapore Dollar', symbol: 'USDSGD', basePrice: 1.3420 },
  { name: 'US Dollar / Hong Kong Dollar', symbol: 'USDHKD', basePrice: 7.8250 },
  { name: 'US Dollar / Thai Baht', symbol: 'USDTHB', basePrice: 35.80 },
  { name: 'US Dollar / South African Rand', symbol: 'USDZAR', basePrice: 18.95 },
  { name: 'US Dollar / Mexican Peso', symbol: 'USDMXN', basePrice: 17.15 },
  { name: 'US Dollar / Turkish Lira', symbol: 'USDTRY', basePrice: 32.50 },
  { name: 'US Dollar / Brazilian Real', symbol: 'USDBRL', basePrice: 5.05 },
  { name: 'US Dollar / Polish Zloty', symbol: 'USDPLN', basePrice: 4.02 },
  { name: 'US Dollar / Swedish Krona', symbol: 'USDSEK', basePrice: 10.85 },
  { name: 'US Dollar / Norwegian Krone', symbol: 'USDNOK', basePrice: 10.95 },
  { name: 'US Dollar / Danish Krone', symbol: 'USDDKK', basePrice: 7.05 },
  { name: 'US Dollar / Saudi Riyal', symbol: 'USDSAR', basePrice: 3.75 },
  { name: 'US Dollar / South Korean Won', symbol: 'USDKRW', basePrice: 1335.50 },
  { name: 'US Dollar / Chinese Yuan', symbol: 'USDCNY', basePrice: 7.24 },
  { name: 'US Dollar / Indonesian Rupiah', symbol: 'USDIDR', basePrice: 15850 },
  { name: 'US Dollar / Philippine Peso', symbol: 'USDPHP', basePrice: 56.20 },
  { name: 'US Dollar / Malaysian Ringgit', symbol: 'USDMYR', basePrice: 4.72 },
  { name: 'US Dollar / Vietnamese Dong', symbol: 'USDVND', basePrice: 24850 },
  
  // Commodities
  { name: 'Gold (Spot)', symbol: 'XAUUSD', basePrice: 2335.00 },
  { name: 'Silver (Spot)', symbol: 'XAGUSD', basePrice: 28.20 },
];

// ─── OPTIONS DATA GENERATOR ──────────────────────────────────────────
function generateOptions() {
  const options = [];
  const underlyingAssets = [
    { name: 'NIFTY', basePrice: 22000, lotSize: 50, strikeInterval: 100, range: 2000 },
    { name: 'BANKNIFTY', basePrice: 48000, lotSize: 15, strikeInterval: 100, range: 4000 },
    { name: 'RELIANCE', basePrice: 2450, lotSize: 250, strikeInterval: 50, range: 400 },
    { name: 'TCS', basePrice: 3850, lotSize: 150, strikeInterval: 50, range: 600 },
  ];
  
  const expiryDates = [
    new Date('2026-04-30'),
    new Date('2026-05-28'),
    new Date('2026-06-25'),
  ];
  
  underlyingAssets.forEach(asset => {
    const { name, basePrice, lotSize, strikeInterval, range } = asset;
    const strikes = [];
    
    // Generate strike prices around current price
    for (let strike = basePrice - range; strike <= basePrice + range; strike += strikeInterval) {
      strikes.push(strike);
    }
    
    // Create CE and PE for each strike and expiry
    expiryDates.forEach(expiry => {
      strikes.forEach(strike => {
        // Calculate premium based on moneyness
        const moneyness = (basePrice - strike) / basePrice;
        const timeValue = Math.sqrt((expiry - new Date()) / (365 * 24 * 60 * 60 * 1000)) * basePrice * 0.15;
        
        // Call option premium
        const cePremium = Math.max(0.05, (moneyness > 0 ? moneyness * basePrice : 0) + timeValue * random(0.8, 1.2));
        
        // Put option premium
        const pePremium = Math.max(0.05, (moneyness < 0 ? -moneyness * basePrice : 0) + timeValue * random(0.8, 1.2));
        
        // Add CE
        options.push({
          name: `${name} ${strike} CE`,
          symbol: `${name}${strike}CE`,
          type: 'OPTION',
          exchange: name === 'NIFTY' || name === 'BANKNIFTY' ? 'NFO' : 'NFO',
          underlyingAsset: name,
          strikePrice: strike,
          expiryDate: expiry,
          optionType: 'CE',
          lotSize: lotSize,
          basePrice: parseFloat(cePremium.toFixed(2)),
        });
        
        // Add PE
        options.push({
          name: `${name} ${strike} PE`,
          symbol: `${name}${strike}PE`,
          type: 'OPTION',
          exchange: name === 'NIFTY' || name === 'BANKNIFTY' ? 'NFO' : 'NFO',
          underlyingAsset: name,
          strikePrice: strike,
          expiryDate: expiry,
          optionType: 'PE',
          lotSize: lotSize,
          basePrice: parseFloat(pePremium.toFixed(2)),
        });
      });
    });
  });
  
  return options;
}

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────
async function seedMarketData() {
  try {
    await connectDB();
    
    logger.info('[Seeder] Starting market data seeding...');
    
    // Clear existing data (optional - comment out if you want to keep existing)
    // await MarketInstrument.deleteMany({});
    // logger.info('[Seeder] Cleared existing market instruments');
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    // 1. Seed Indian Stocks
    logger.info('[Seeder] Seeding Indian stocks...');
    for (const stock of indianStocks) {
      const exists = await MarketInstrument.findOne({ symbol: stock.symbol, type: 'STOCK' });
      if (exists) {
        skippedCount++;
        continue;
      }
      
      const chartData = generateCandles(stock.basePrice, 50, '5min');
      const currentPrice = chartData[chartData.length - 1].close;
      const open = chartData[0].open;
      const high = Math.max(...chartData.map(c => c.high));
      const low = Math.min(...chartData.map(c => c.low));
      const volume = chartData.reduce((sum, c) => sum + c.volume, 0);
      
      await MarketInstrument.create({
        name: stock.name,
        symbol: stock.symbol,
        type: 'STOCK',
        exchange: 'NSE',
        price: currentPrice,
        open: open,
        high: high,
        low: low,
        close: currentPrice,
        changePercent: ((currentPrice - open) / open) * 100,
        change: currentPrice - open,
        volume: volume,
        sector: stock.sector,
        chartData: chartData,
        isActive: true,
      });
      
      insertedCount++;
    }
    logger.info(`[Seeder] Indian stocks: ${insertedCount} inserted, ${skippedCount} skipped`);
    
    // 2. Seed Forex Pairs
    logger.info('[Seeder] Seeding forex pairs...');
    let forexInserted = 0;
    let forexSkipped = 0;
    
    for (const pair of forexPairs) {
      const exists = await MarketInstrument.findOne({ symbol: pair.symbol, type: 'FOREX' });
      if (exists) {
        forexSkipped++;
        continue;
      }
      
      const chartData = generateCandles(pair.basePrice, 50, '15min');
      const currentPrice = chartData[chartData.length - 1].close;
      const open = chartData[0].open;
      const high = Math.max(...chartData.map(c => c.high));
      const low = Math.min(...chartData.map(c => c.low));
      const bid = currentPrice - random(0.0001, 0.0005, 5);
      const ask = currentPrice + random(0.0001, 0.0005, 5);
      const spread = ask - bid;
      
      await MarketInstrument.create({
        name: pair.name,
        symbol: pair.symbol,
        type: 'FOREX',
        exchange: 'FOREX',
        price: currentPrice,
        open: open,
        high: high,
        low: low,
        close: currentPrice,
        changePercent: ((currentPrice - open) / open) * 100,
        change: currentPrice - open,
        volume: 0,
        bidPrice: bid,
        askPrice: ask,
        spread: spread,
        chartData: chartData,
        isActive: true,
      });
      
      forexInserted++;
    }
    logger.info(`[Seeder] Forex pairs: ${forexInserted} inserted, ${forexSkipped} skipped`);
    insertedCount += forexInserted;
    skippedCount += forexSkipped;
    
    // 3. Seed Options
    logger.info('[Seeder] Generating options contracts...');
    const optionsData = generateOptions();
    let optionsInserted = 0;
    let optionsSkipped = 0;
    
    for (const option of optionsData) {
      const exists = await MarketInstrument.findOne({ symbol: option.symbol, type: 'OPTION' });
      if (exists) {
        optionsSkipped++;
        continue;
      }
      
      const chartData = generateCandles(option.basePrice, 50, '5min');
      const currentPrice = chartData[chartData.length - 1].close;
      const open = chartData[0].open;
      const high = Math.max(...chartData.map(c => c.high));
      const low = Math.min(...chartData.map(c => c.low));
      const openInterest = Math.floor(random(10000, 500000));
      
      await MarketInstrument.create({
        name: option.name,
        symbol: option.symbol,
        type: 'OPTION',
        exchange: option.exchange,
        price: currentPrice,
        open: open,
        high: high,
        low: low,
        close: currentPrice,
        changePercent: ((currentPrice - open) / open) * 100,
        change: currentPrice - open,
        volume: Math.floor(random(1000, 50000)),
        strikePrice: option.strikePrice,
        expiryDate: option.expiryDate,
        optionType: option.optionType,
        lotSize: option.lotSize,
        openInterest: openInterest,
        chartData: chartData,
        isActive: true,
      });
      
      optionsInserted++;
    }
    logger.info(`[Seeder] Options: ${optionsInserted} inserted, ${optionsSkipped} skipped`);
    insertedCount += optionsInserted;
    skippedCount += optionsSkipped;
    
    // Summary
    const totalInstruments = await MarketInstrument.countDocuments();
    const stockCount = await MarketInstrument.countDocuments({ type: 'STOCK' });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX' });
    const optionCount = await MarketInstrument.countDocuments({ type: 'OPTION' });
    
    logger.info('═══════════════════════════════════════');
    logger.info('[Seeder] ✅ MARKET DATA SEEDING COMPLETE!');
    logger.info('═══════════════════════════════════════');
    logger.info(`Total Instruments: ${totalInstruments}`);
    logger.info(`  ├─ Indian Stocks: ${stockCount}`);
    logger.info(`  ├─ Forex Pairs: ${forexCount}`);
    logger.info(`  └─ Options Contracts: ${optionCount}`);
    logger.info(`Inserted: ${insertedCount}, Skipped (already exists): ${skippedCount}`);
    logger.info('═══════════════════════════════════════');
    
    await mongoose.disconnect();
    logger.info('[Seeder] Database disconnected');
    process.exit(0);
    
  } catch (err) {
    logger.error('[Seeder] Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run seeder
seedMarketData();
