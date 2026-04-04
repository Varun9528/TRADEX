import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch real-time price for a market instrument from database
 * @param {string} symbol - Instrument symbol
 * @returns {Promise<object>} Price data
 */
export const fetchRealTimePrice = async (symbol) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/market`);
    const data = response.data.data || [];
    const instrument = data.find(inst => inst.symbol === symbol);
    if (!instrument) throw new Error('Instrument not found');
    return instrument;
  } catch (error) {
    console.error(`[MarketService] Error fetching price for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetch historical candlestick data from simulation backend
 * @param {string} symbol - Instrument symbol
 * @param {string} interval - Candle interval (1min, 5min, 15min, 1h, 1D)
 * @param {number} outputsize - Number of candles (default: 50)
 * @returns {Promise<Array>} Array of candle data
 */
export const fetchCandles = async (symbol, interval = '1min', outputsize = 50) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/market/chart/${symbol}`,
      {
        params: { interval, outputsize },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(`[MarketService] Error fetching candles for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetch detailed quote data for a market instrument
 * @param {string} symbol - Instrument symbol
 * @returns {Promise<object>} Quote data with OHLC, change, volume, etc.
 */
export const fetchQuote = async (symbol) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/market`);
    const data = response.data.data || [];
    const instrument = data.find(inst => inst.symbol === symbol);
    if (!instrument) throw new Error('Instrument not found');
    return instrument;
  } catch (error) {
    console.error(`[MarketService] Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};



/**
 * Format price for display (Indian Rupee)
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number') return '₹0.00';
  return `₹${price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format percentage change for display
 * @param {number} change - Change value
 * @returns {string} Formatted percentage
 */
export const formatPercent = (change) => {
  if (typeof change !== 'number') return '0.00%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

/**
 * Calculate P&L for a position
 * @param {number} buyPrice - Buy average price
 * @param {number} currentPrice - Current market price
 * @param {number} quantity - Quantity held
 * @returns {object} P&L data
 */
export const calculatePnL = (buyPrice, currentPrice, quantity) => {
  const pnl = (currentPrice - buyPrice) * quantity;
  const pnlPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
  
  return {
    pnl,
    pnlPercent,
    isProfit: pnl >= 0,
  };
};

/**
 * Calculate required margin based on product type
 * @param {number} price - Stock price
 * @param {number} quantity - Quantity
 * @param {string} productType - MIS or CNC
 * @returns {number} Required margin
 */
export const calculateMargin = (price, quantity, productType) => {
  const orderValue = price * quantity;
  
  if (productType === 'MIS') {
    // Intraday: 20% margin
    return orderValue * 0.2;
  } else if (productType === 'CNC') {
    // Delivery: 100% margin
    return orderValue;
  } else {
    // MTF or other: default to full amount
    return orderValue;
  }
};

export default {
  fetchRealTimePrice,
  fetchCandles,
  fetchQuote,
  formatPrice,
  formatPercent,
  calculatePnL,
  calculateMargin,
};
