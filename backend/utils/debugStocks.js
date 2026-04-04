const mongoose = require('mongoose');
const MarketInstrument = require('../models/MarketInstrument');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradex_india';

async function debugStocks() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Get all stocks regardless of status
    const allStocks = await MarketInstrument.find({ type: 'STOCK' }).select('symbol name isActive').sort({ symbol: 1 });
    
    console.log(`Total STOCK documents in DB: ${allStocks.length}\n`);
    
    // Count active vs inactive
    const active = allStocks.filter(s => s.isActive).length;
    const inactive = allStocks.filter(s => !s.isActive).length;
    
    console.log(`Active: ${active}`);
    console.log(`Inactive: ${inactive}\n`);
    
    // Show first 30 symbols
    console.log('First 30 stocks (sorted by symbol):');
    allStocks.slice(0, 30).forEach((s, i) => {
      console.log(`${i+1}. ${s.symbol.padEnd(15)} - ${s.name.padEnd(40)} [${s.isActive ? 'ACTIVE' : 'INACTIVE'}]`);
    });
    
    // Check for duplicates
    const symbolCounts = {};
    allStocks.forEach(s => {
      symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
    });
    
    const duplicates = Object.entries(symbolCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE SYMBOLS FOUND:');
      duplicates.forEach(([symbol, count]) => {
        console.log(`  ${symbol}: ${count} occurrences`);
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugStocks();
