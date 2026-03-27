const axios = require('axios');
const logger = require('./logger');

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const TWELVEDATA_BASE_URL = process.env.TWELVEDATA_BASE_URL || 'https://api.twelvedata.com';

// Cache to store prices and avoid excessive API calls
const priceCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Get real-time price for a single symbol
 * @param {string} symbol - Stock symbol (e.g., RELIANCE.NS)
 * @returns {Promise<object>} Price data
 */
async function getRealtimePrice(symbol) {
  try {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Ensure symbol has .NS suffix for NSE
    const nseSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;

    const response = await axios.get(`${TWELVEDATA_BASE_URL}/price`, {
      params: {
        symbol: nseSymbol,
        apikey: TWELVEDATA_API_KEY,
      },
      timeout: 10000,
    });

    // Validate response
    if (!response.data || !response.data.price || isNaN(parseFloat(response.data.price))) {
      throw new Error(`Invalid price data for ${nseSymbol}`);
    }

    const priceData = {
      symbol: nseSymbol,
      price: parseFloat(response.data.price),
      timestamp: new Date().toISOString(),
    };

    // Update cache
    priceCache.set(symbol, {
      data: priceData,
      timestamp: Date.now(),
    });

    return priceData;
  } catch (error) {
    logger.error(`[MarketService] Error fetching price for ${symbol}: ${error.message}`);
    
    // Return cached data if available even if expired
    const cached = priceCache.get(symbol);
    if (cached) {
      return cached.data;
    }
    
    throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
  }
}

/**
 * Get historical candlestick data
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Candle interval (1min, 5min, 15min, 1h, 1D)
 * @param {number} outputsize - Number of candles (default: 50)
 * @returns {Promise<Array>} Array of candle data
 */
async function getCandles(symbol, interval = '1min', outputsize = 50) {
  try {
    const response = await axios.get(`${TWELVEDATA_BASE_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: interval,
        outputsize: outputsize,
        apikey: TWELVEDATA_API_KEY,
      },
      timeout: 15000,
    });

    // Transform TwelveData response to candle format
    const candles = Object.values(response.data.values).map((candle) => ({
      time: Math.floor(new Date(candle.datetime).getTime() / 1000),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
    }));

    // Sort by time ascending
    candles.sort((a, b) => a.time - b.time);

    return candles;
  } catch (error) {
    logger.error(`[MarketService] Error fetching candles for ${symbol}: ${error.message}`);
    throw new Error(`Failed to fetch candles for ${symbol}: ${error.message}`);
  }
}

/**
 * Get prices for multiple symbols (batch fetch)
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Array>} Array of price data
 */
async function getWatchlistPrices(symbols) {
  const results = [];
  
  // Fetch all symbols in parallel
  const promises = symbols.map(async (symbol) => {
    try {
      const priceData = await getRealtimePrice(symbol);
      return { ...priceData, success: true };
    } catch (error) {
      return {
        symbol,
        error: error.message,
        success: false,
      };
    }
  });

  const settled = await Promise.allSettled(promises);
  
  settled.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      results.push(result.value);
    } else {
      logger.error('[MarketService] Failed to fetch price:', result.reason || result.value?.error);
    }
  });

  return results;
}

/**
 * Get quote (detailed market data) for a symbol
 * @param {string} symbol - Stock symbol
 * @returns {Promise<object>} Quote data with OHLC, change, etc.
 */
async function getQuote(symbol) {
  try {
    // Check cache first
    const cached = priceCache.get(`${symbol}_quote`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Ensure symbol has .NS suffix for NSE
    const nseSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;

    const response = await axios.get(`${TWELVEDATA_BASE_URL}/quote`, {
      params: {
        symbol: nseSymbol,
        apikey: TWELVEDATA_API_KEY,
      },
      timeout: 10000,
    });

    // Validate response data
    if (!response.data || !response.data.close || isNaN(parseFloat(response.data.close))) {
      throw new Error(`Invalid quote data for ${nseSymbol}`);
    }

    const quoteData = {
      symbol: response.data.symbol || nseSymbol,
      name: response.data.name,
      exchange: response.data.exchange,
      currency: response.data.currency,
      datetime: response.data.datetime,
      timestamp: Math.floor(new Date(response.data.datetime).getTime() / 1000),
      open: parseFloat(response.data.open) || 0,
      high: parseFloat(response.data.high) || 0,
      low: parseFloat(response.data.low) || 0,
      close: parseFloat(response.data.close) || 0,
      previousClose: parseFloat(response.data.previous_close) || 0,
      change: parseFloat(response.data.change) || 0,
      percentChange: parseFloat(response.data.percent_change) || 0,
      volume: parseInt(response.data.volume) || 0,
    };

    // Update cache
    priceCache.set(`${symbol}_quote`, {
      data: quoteData,
      timestamp: Date.now(),
    });

    return quoteData;
  } catch (error) {
    logger.error(`[MarketService] Error fetching quote for ${symbol}: ${error.message}`);
    
    const cached = priceCache.get(`${symbol}_quote`);
    if (cached) {
      return cached.data;
    }
    
    throw new Error(`Failed to fetch quote for ${symbol}: ${error.message}`);
  }
}

/**
 * Clear cache for a specific symbol
 * @param {string} symbol - Stock symbol
 */
function clearCache(symbol) {
  priceCache.delete(symbol);
  priceCache.delete(`${symbol}_quote`);
}

/**
 * Clear all cache
 */
function clearAllCache() {
  priceCache.clear();
}

module.exports = {
  getRealtimePrice,
  getCandles,
  getWatchlistPrices,
  getQuote,
  clearCache,
  clearAllCache,
};
