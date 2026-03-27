// Mock candlestick data generator for TradingView chart
export function generateMockCandles(symbol, days = 100) {
  const candles = [];
  const basePrice = Math.random() * 2000 + 500; // Random base price between 500-2500
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random price movement between -3% to +3%
    const changePercent = (Math.random() - 0.5) * 0.06;
    const open = currentPrice;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    
    candles.push({
      time: date.getTime() / 1000, // Unix timestamp in seconds
      open,
      high,
      low,
      close,
    });
    
    currentPrice = close;
  }
  
  return candles;
}

// Generate intraday candles (1-minute intervals)
export function generateIntradayCandles(symbol, minutes = 390) {
  const candles = [];
  const basePrice = Math.random() * 2000 + 500;
  let currentPrice = basePrice;
  const now = new Date();
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 15, 0, 0); // Indian market opens at 9:15 AM
  
  for (let i = 0; i < minutes; i++) {
    const time = new Date(marketOpen);
    time.setMinutes(time.getMinutes() + i);
    
    const changePercent = (Math.random() - 0.5) * 0.01; // Smaller movements for intraday
    const open = currentPrice;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    candles.push({
      time: time.getTime() / 1000,
      open,
      high,
      low,
      close,
    });
    
    currentPrice = close;
  }
  
  return candles;
}
