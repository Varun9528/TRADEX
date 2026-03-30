const MarketInstrument = require('../models/MarketInstrument');
const logger = require('./logger');

/**
 * Chart Simulation Service
 * Generates realistic price movements and chart candles
 */

class ChartSimulationService {
  constructor() {
    this.simulationInterval = null;
    this.isRunning = false;
  }

  /**
   * Generate realistic price movement
   * @param {number} currentPrice - Current price
   * @param {number} volatility - Volatility percentage (default 0.5%)
   * @returns {object} New price data
   */
  generatePriceMovement(currentPrice, volatility = 0.005) {
    const changePercent = (Math.random() - 0.5) * 2 * volatility;
    const change = currentPrice * changePercent;
    const newPrice = currentPrice + change;
    
    return {
      newPrice: Math.max(0.01, newPrice), // Ensure price doesn't go negative
      changePercent,
      change
    };
  }

  /**
   * Generate candle for chart
   * @param {number} price - Current price
   * @param {string} trend - UP or DOWN
   * @returns {object} Candle data
   */
  generateCandle(price, trend = 'FLAT') {
    const volatility = 0.002; // 0.2% intraday volatility
    const range = price * volatility;
    
    let open, high, low, close;
    
    if (trend === 'UP') {
      open = price - (range * 0.3);
      close = price + (range * 0.3);
      high = close + (range * 0.2);
      low = open - (range * 0.2);
    } else if (trend === 'DOWN') {
      open = price + (range * 0.3);
      close = price - (range * 0.3);
      high = open + (range * 0.2);
      low = close - (range * 0.2);
    } else {
      open = price;
      close = price;
      high = price + (range * 0.5);
      low = price - (range * 0.5);
    }
    
    return {
      timestamp: new Date(),
      open: Math.abs(open),
      high: Math.abs(high),
      low: Math.abs(low),
      close: Math.abs(close),
      volume: Math.floor(Math.random() * 10000) + 1000
    };
  }

  /**
   * Update all instruments with simulated price movement
   */
  async simulateMarket() {
    try {
      const instruments = await MarketInstrument.find({ isActive: true });
      
      for (const instrument of instruments) {
        // Generate price movement
        const { newPrice } = this.generatePriceMovement(instrument.price, 0.003);
        
        // Update price
        instrument.price = newPrice;
        
        // Update high/low for the day
        if (newPrice > instrument.high) {
          instrument.high = newPrice;
        }
        if (newPrice < instrument.low) {
          instrument.low = newPrice;
        }
        
        // Add candle to chart data (keep last 100 candles)
        const candle = this.generateCandle(newPrice, instrument.trend);
        instrument.chartData.push(candle);
        
        if (instrument.chartData.length > 100) {
          instrument.chartData.shift(); // Remove oldest candle
        }
        
        await instrument.save();
      }
      
      logger.debug(`Simulated price movement for ${instruments.length} instruments`);
    } catch (error) {
      logger.error('Error in market simulation', error);
    }
  }

  /**
   * Start automatic market simulation
   * Runs every 3 seconds
   */
  startSimulation() {
    if (this.isRunning) {
      logger.warn('Market simulation already running');
      return;
    }
    
    this.isRunning = true;
    this.simulationInterval = setInterval(() => {
      this.simulateMarket();
    }, 3000); // Every 3 seconds
    
    logger.info('🎯 Market simulation started - Charts will update every 3 seconds');
  }

  /**
   * Stop market simulation
   */
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      this.isRunning = false;
      logger.info('Market simulation stopped');
    }
  }

  /**
   * Initialize historical chart data for an instrument
   * @param {string} symbol - Instrument symbol
   * @param {number} basePrice - Starting price
   * @param {number} days - Number of days of data
   */
  async initializeChartData(symbol, basePrice, days = 30) {
    try {
      const instrument = await MarketInstrument.findOne({ symbol });
      
      if (!instrument) {
        throw new Error('Instrument not found');
      }
      
      const candles = [];
      let currentPrice = basePrice;
      const now = new Date();
      
      // Generate daily candles backwards
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const volatility = 0.02; // 2% daily volatility
        const dayChange = (Math.random() - 0.5) * 2 * volatility;
        const open = currentPrice;
        const close = currentPrice * (1 + dayChange);
        const high = Math.max(open, close) * 1.01;
        const low = Math.min(open, close) * 0.99;
        
        candles.push({
          timestamp: date,
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 100000) + 5000
        });
        
        currentPrice = close;
      }
      
      instrument.chartData = candles;
      instrument.price = currentPrice;
      instrument.open = candles[0].open;
      instrument.high = Math.max(...candles.map(c => c.high));
      instrument.low = Math.min(...candles.map(c => c.low));
      instrument.close = candles[candles.length - 1].close;
      
      await instrument.save();
      
      logger.info(`Initialized ${days} days of chart data for ${symbol}`);
      return instrument;
    } catch (error) {
      logger.error('Error initializing chart data', error);
      throw error;
    }
  }
}

// Export singleton instance
const chartSimulationService = new ChartSimulationService();
module.exports = chartSimulationService;
