const cron = require('node-cron');
const Stock = require('../models/Stock');
const logger = require('./logger');

let priceEngineInterval = null;
let io = null;

// ── MARKET HOURS: 9:15 AM – 3:30 PM IST Mon-Fri ──
function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  const hour = ist.getHours();
  const min = ist.getMinutes();
  if (day === 0 || day === 6) return false; // Weekend
  const totalMin = hour * 60 + min;
  return totalMin >= 555 && totalMin <= 930; // 9:15 – 15:30
}

// ── SIMULATE PRICE MOVEMENT ──
function simulatePriceChange(currentPrice, volatility = 1.0) {
  const sigma = 0.0015 * volatility;
  const u1 = Math.random(), u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const change = currentPrice * sigma * z;
  return Math.max(1, currentPrice + change);
}

// ── UPDATE ALL STOCK PRICES ──
async function updatePrices() {
  try {
    const stocks = await Stock.find({ isActive: true }).select('symbol currentPrice previousClose volatilityFactor adminOverridePrice');
    const updates = [];
    const pricePayload = [];

    for (const stock of stocks) {
      // Respect admin override price
      if (stock.adminOverridePrice && stock.adminOverridePrice !== stock.currentPrice) {
        stock.currentPrice = stock.adminOverridePrice;
        stock.adminOverridePrice = null;
      } else {
        stock.currentPrice = simulatePriceChange(stock.currentPrice, stock.volatilityFactor);
      }

      const change = stock.currentPrice - stock.previousClose;
      const changePercent = (change / stock.previousClose) * 100;

      updates.push({
        updateOne: {
          filter: { _id: stock._id },
          update: {
            $set: {
              currentPrice: parseFloat(stock.currentPrice.toFixed(2)),
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(3)),
            },
            $max: { dayHigh: stock.currentPrice },
            $min: { dayLow: stock.currentPrice },
          }
        }
      });

      pricePayload.push({
        symbol: stock.symbol,
        currentPrice: parseFloat(stock.currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(3)),
      });
    }

    if (updates.length > 0) {
      await Stock.bulkWrite(updates);
    }

    // Broadcast to all clients watching stocks
    if (io && pricePayload.length > 0) {
      io.to('stocks:live').emit('price:update', pricePayload);
    }
  } catch (err) {
    logger.error('Price engine error:', err);
  }
}

// ── RESET DAY STATS AT MARKET OPEN ──
async function resetDayStats() {
  try {
    await Stock.updateMany(
      { isActive: true },
      [{ $set: { previousClose: '$currentPrice', openPrice: '$currentPrice', dayHigh: '$currentPrice', dayLow: '$currentPrice', volume: 0 } }]
    );
    logger.info('Day stats reset for market open.');
  } catch (err) {
    logger.error('Reset day stats error:', err);
  }
}

// ── INIT ──
function initPriceEngine(socketIo) {
  io = socketIo;

  // Update every 3 seconds when market is open, every 30s when closed
  priceEngineInterval = setInterval(async () => {
    await updatePrices();
  }, isMarketOpen() ? 3000 : 30000);

  // Re-evaluate interval rate every minute
  setInterval(() => {
    if (priceEngineInterval) clearInterval(priceEngineInterval);
    priceEngineInterval = setInterval(async () => {
      await updatePrices();
    }, isMarketOpen() ? 3000 : 30000);
  }, 60000);

  // Reset at 9:15 AM IST on weekdays
  cron.schedule('15 9 * * 1-5', resetDayStats, { timezone: 'Asia/Kolkata' });

  // Append to price history every hour
  cron.schedule('0 * * * 1-5', async () => {
    try {
      const stocks = await Stock.find({ isActive: true }).select('currentPrice');
      const bulk = stocks.map(s => ({
        updateOne: {
          filter: { _id: s._id },
          update: { $push: { priceHistory: { $each: [{ close: s.currentPrice, timestamp: new Date() }], $slice: -720 } } }
        }
      }));
      await Stock.bulkWrite(bulk);
    } catch (err) {
      logger.error('Price history append error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('Price engine initialized.');
}

function stopPriceEngine() {
  if (priceEngineInterval) {
    clearInterval(priceEngineInterval);
    priceEngineInterval = null;
  }
}

module.exports = { initPriceEngine, stopPriceEngine, isMarketOpen };
