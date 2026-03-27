const Stock = require('../models/Stock');
const logger = require('./logger');

// Default Indian stocks watchlist (NSE symbols) with base prices
const DEFAULT_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', basePrice: 2450 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', basePrice: 3850 },
  { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'IT', basePrice: 1680 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', basePrice: 1720 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', basePrice: 1150 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', basePrice: 780 },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Finance', basePrice: 3650 },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', basePrice: 450 },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking', basePrice: 1850 },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', basePrice: 1180 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', basePrice: 1350 },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'FMCG', basePrice: 2850 },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto', basePrice: 11200 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance', basePrice: 7200 },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT', basePrice: 480 },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT', basePrice: 1580 },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharma', basePrice: 1680 },
  { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'FMCG', basePrice: 3450 },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement', basePrice: 10500 },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas', sector: 'Energy', basePrice: 265 },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power', basePrice: 380 },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power', basePrice: 320 },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metal', basePrice: 920 },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metal', basePrice: 640 },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Energy', basePrice: 1450 },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories', sector: 'Pharma', basePrice: 6200 },
  { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories', sector: 'Pharma', basePrice: 3650 },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Cement', basePrice: 2580 },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance', basePrice: 1680 },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', basePrice: 2450 },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking', basePrice: 1850 },
  { symbol: 'LTIM.NS', name: 'LTIMindtree', sector: 'IT', basePrice: 5850 },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT', basePrice: 1680 },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance', sector: 'Finance', basePrice: 2850 },
  { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Energy', basePrice: 480 },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Auto', basePrice: 4850 },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Auto', basePrice: 4580 },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Auto', basePrice: 1050 },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metal', basePrice: 145 },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking', basePrice: 1520 },
];

let io = null;
let updateInterval = null;
const UPDATE_INTERVAL_MS = 3000; // 3 seconds for realtime feel
let priceJobStarted = false;

/**
 * Initialize the price update job
 * @param {Server} socketIo - Socket.IO server instance
 */
function initializePriceUpdateJob(socketIo) {
  if (priceJobStarted) {
    logger.warn('[PriceUpdateJob] Price update job already running - skipping duplicate initialization');
    return;
  }

  logger.info('[PriceUpdateJob] Initializing simulated price update job');
  
  // Store socket instance
  io = socketIo;
  global.io = socketIo;

  // Run immediately on startup
  fetchAndUpdatePrices();

  // Then run every 3 seconds
  updateInterval = setInterval(fetchAndUpdatePrices, UPDATE_INTERVAL_MS);
  priceJobStarted = true;
  
  logger.info(`[PriceUpdateJob] Simulated price updates scheduled every ${UPDATE_INTERVAL_MS / 1000} seconds`);
}

/**
 * Generate simulated price movement
 * @param {number} currentPrice - Current price
 * @returns {object} New price data
 */
function generatePriceMovement(currentPrice) {
  // Random movement between -1.5% and +1.5%
  const changePercent = (Math.random() - 0.5) * 3; // -1.5% to +1.5%
  const change = currentPrice * (changePercent / 100);
  const newPrice = currentPrice + change;
  
  return {
    newPrice: Math.max(newPrice, 1), // Ensure price doesn't go below 1
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}

/**
 * Fetch prices (simulated) and update database + broadcast via Socket.IO
 */
async function fetchAndUpdatePrices() {
  try {
    logger.debug('[PriceUpdateJob] Generating simulated price updates...');

    // Get all active stocks from database
    const dbStocks = await Stock.find({ isActive: true }).select('symbol currentPrice').lean();
    
    // Combine default stocks with database stocks
    const stockMap = new Map();
    
    // Add default stocks with base prices
    DEFAULT_STOCKS.forEach(stock => {
      stockMap.set(stock.symbol, {
        ...stock,
        currentPrice: stock.basePrice,
      });
    });
    
    // Update with database prices if available
    dbStocks.forEach(dbStock => {
      if (stockMap.has(dbStock.symbol)) {
        stockMap.get(dbStock.symbol).currentPrice = dbStock.currentPrice || stockMap.get(dbStock.symbol).basePrice;
      } else {
        stockMap.set(dbStock.symbol, {
          symbol: dbStock.symbol,
          name: dbStock.symbol.replace('.NS', ''),
          sector: 'Other',
          basePrice: dbStock.currentPrice || 500,
          currentPrice: dbStock.currentPrice || 500,
        });
      }
    });

    // Generate price movements and update
    const socketUpdates = [];
    const symbols = Array.from(stockMap.keys());
    
    for (const symbol of symbols) {
      try {
        const stock = stockMap.get(symbol);
        const movement = generatePriceMovement(stock.currentPrice);
        
        // Update stock in database
        let dbStock = await Stock.findOne({ symbol });
        
        if (!dbStock) {
          // Create new stock entry
          dbStock = new Stock({
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            currentPrice: movement.newPrice,
            previousClose: stock.currentPrice,
            change: movement.change,
            changePercent: movement.changePercent,
            isActive: true,
          });
          await dbStock.save();
        } else {
          // Update existing stock
          dbStock.previousClose = dbStock.currentPrice;
          dbStock.currentPrice = movement.newPrice;
          dbStock.change = movement.change;
          dbStock.changePercent = movement.changePercent;
          await dbStock.save();
        }

        // Prepare data for socket broadcast
        socketUpdates.push({
          symbol: dbStock.symbol,
          currentPrice: dbStock.currentPrice,
          change: dbStock.change,
          changePercent: dbStock.changePercent,
        });

      } catch (error) {
        logger.error(`[PriceUpdateJob] Error updating stock ${symbol}: ${error.message}`);
      }
    }

    // Broadcast updates via Socket.IO
    if (io && socketUpdates.length > 0) {
      io.emit('price:update', socketUpdates);
      logger.debug(`[PriceUpdateJob] Broadcasted ${socketUpdates.length} price updates`);
    }

  } catch (error) {
    logger.error(`[PriceUpdateJob] Critical error: ${error.message}`);
  }
}

/**
 * Stop the price update job
 */
function stopPriceUpdateJob() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    priceJobStarted = false;
    logger.info('[PriceUpdateJob] Price update job stopped');
  }
}

module.exports = {
  initializePriceUpdateJob,
  stopPriceUpdateJob,
};
