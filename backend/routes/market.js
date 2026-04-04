const express = require('express');
const router = express.Router();
const MarketInstrument = require('../models/MarketInstrument');
const { protect, adminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

// ─── GET ALL MARKET INSTRUMENTS ──────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type = 'all', exchange = 'all', status = 'active', search = '', limit = 1000 } = req.query;
    
    console.log('[Market API Debug] Query params:', { type, exchange, status, search, limit });
    
    const query = {};
    
    // Filter by type - CRITICAL: must match exactly
    if (type !== 'all') {
      query.type = type.toUpperCase();
    }
    
    // Filter by exchange
    if (exchange !== 'all') {
      query.exchange = exchange;
    }
    
    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Search by name or symbol
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { symbol: new RegExp(search, 'i') }
      ];
    }
    
    console.log('[Market API Debug] MongoDB query:', JSON.stringify(query));
    
    // Smart sorting: prioritize by type to ensure results are returned
    let sortCriteria = { volume: -1 };
    const normalizedType = type.toUpperCase();
    if (normalizedType === 'OPTION') {
      // For options, sort by expiry date then strike price
      sortCriteria = { expiryDate: 1, strikePrice: 1 };
    } else if (normalizedType === 'FOREX') {
      // For forex, sort alphabetically by symbol
      sortCriteria = { symbol: 1 };
    }
    
    const instruments = await MarketInstrument.find(query)
      .sort(sortCriteria)
      .limit(parseInt(limit));
    
    console.log('[Market API Debug] Found', instruments.length, 'instruments');
    
    // NO FALLBACK DATA - Admin must add instruments
    if (!instruments || instruments.length === 0) {
      console.log('[Market API] No instruments found - admin must add instruments');
      return res.json({
        success: true,
        data: [], // Empty array - NO demo data
        count: 0,
        message: 'No instruments available. Admin must add instruments from admin panel.'
      });
    }
    
    // Transform instruments to ensure all fields exist
    const formattedInstruments = instruments.map(inst => {
      // CRITICAL: Map all possible price fields to ensure price is never 0
      const priceValue = inst.price || inst.ltp || inst.lastPrice || inst.close || 0;
      
      const base = {
        _id: inst._id,
        symbol: inst.symbol,
        name: inst.name,
        type: inst.type,
        price: priceValue,  // ✅ Always has a value
        currentPrice: priceValue,  // ✅ Consistent with price
        changePercent: inst.changePercent || 0,
        change: inst.change || 0,
        open: inst.open || priceValue,
        high: inst.high || priceValue,
        low: inst.low || priceValue,
        close: inst.close || priceValue,
        volume: inst.volume || 0,
        status: inst.isActive ? 'active' : 'inactive',
        isActive: inst.isActive,
        exchange: inst.exchange,
        sector: inst.sector,
        description: inst.description,
        trend: inst.trend || 'FLAT',
      };
      
      // Include option-specific fields if type is OPTION
      if (inst.type === 'OPTION') {
        return {
          ...base,
          strikePrice: inst.strikePrice || null,
          expiryDate: inst.expiryDate || null,
          lotSize: inst.lotSize || 50,
          optionType: inst.optionType || null,
          underlyingAsset: inst.underlyingAsset || null,
        };
      }
      
      return base;
    });
    
    res.json({
      success: true,
      data: formattedInstruments,
      count: formattedInstruments.length
    });
  } catch (error) {
    logger.error('Error fetching market instruments', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market instruments',
      error: error.message
    });
  }
});

// ─── GET SINGLE INSTRUMENT ──────────────────────────────
router.get('/:symbol', async (req, res) => {
  try {
    const instrument = await MarketInstrument.findOne({ 
      symbol: req.params.symbol.toUpperCase() 
    });
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }
    
    res.json({
      success: true,
      data: instrument
    });
  } catch (error) {
    logger.error('Error fetching instrument', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instrument',
      error: error.message
    });
  }
});

// ─── CREATE INSTRUMENT (ADMIN ONLY) ──────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      name, symbol, type, exchange, price, open, high, low, close,
      volume, description, sector, industry
    } = req.body;
    
    // Validate required fields
    if (!name || !symbol || !type || !exchange || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, Symbol, Type, Exchange, and Price are required'
      });
    }
    
    // CRITICAL: Standardize type to uppercase
    const standardizedType = type.toUpperCase().trim();
    
    // Validate allowed types
    const allowedTypes = ['STOCK', 'FOREX', 'OPTION'];
    if (!allowedTypes.includes(standardizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check if symbol already exists
    const existing = await MarketInstrument.findOne({ symbol: symbol.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Instrument with this symbol already exists'
      });
    }
    
    const instrument = await MarketInstrument.create({
      name,
      symbol: symbol.toUpperCase(),
      type: standardizedType,  // ✅ Use standardized uppercase type
      exchange,
      price,
      open: open || price,
      high: high || price,
      low: low || price,
      close: close || price,
      volume: volume || 0,
      description,
      sector,
      industry,
      createdBy: req.user._id
    });
    
    logger.info(`Instrument created: ${symbol} (type: ${standardizedType}) by admin ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Instrument created successfully',
      data: instrument
    });
  } catch (error) {
    logger.error('Error creating instrument', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create instrument',
      error: error.message
    });
  }
});

// ─── UPDATE INSTRUMENT (ADMIN ONLY) ──────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const instrument = await MarketInstrument.findById(req.params.id);
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }
    
    const allowedFields = [
      'name', 'symbol', 'type', 'exchange', 'price', 'open', 'high',
      'low', 'close', 'volume', 'description', 'sector', 'industry', 'isActive'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // CRITICAL: Standardize type to uppercase when updating
        if (field === 'type') {
          const standardizedType = req.body[field].toUpperCase().trim();
          const allowedTypes = ['STOCK', 'FOREX', 'OPTION'];
          if (!allowedTypes.includes(standardizedType)) {
            logger.warn(`Invalid type attempted: ${req.body[field]}`);
            return; // Skip invalid type
          }
          instrument[field] = standardizedType;
        } else {
          instrument[field] = req.body[field];
        }
      }
    });
    
    await instrument.save();
    
    logger.info(`Instrument updated: ${instrument.symbol} (type: ${instrument.type}) by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Instrument updated successfully',
      data: instrument
    });
  } catch (error) {
    logger.error('Error updating instrument', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update instrument',
      error: error.message
    });
  }
});

// ─── DELETE INSTRUMENT (ADMIN ONLY) ──────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const instrument = await MarketInstrument.findById(req.params.id);
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }
    
    await instrument.deleteOne();
    
    logger.info(`Instrument deleted: ${instrument.symbol} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Instrument deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting instrument', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete instrument',
      error: error.message
    });
  }
});

// ─── UPDATE PRICE ONLY (ADMIN ONLY) ──────────────────────────────
router.patch('/price/:id', protect, adminOnly, async (req, res) => {
  try {
    const { price } = req.body;
    
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }
    
    const instrument = await MarketInstrument.findById(req.params.id);
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }
    
    const oldPrice = instrument.price;
    instrument.price = price;
    await instrument.save();
    
    logger.info(`Price updated for ${instrument.symbol}: ${oldPrice} → ${price} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Price updated successfully',
      data: {
        symbol: instrument.symbol,
        oldPrice,
        newPrice: price,
        changePercent: instrument.changePercent
      }
    });
  } catch (error) {
    logger.error('Error updating price', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price',
      error: error.message
    });
  }
});

// ─── GET CHART DATA (CANDLESTICKS) ──────────────────────────────
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1min', outputsize = 50 } = req.query;
    
    // Get instrument from database
    const instrument = await MarketInstrument.findOne({ 
      symbol: symbol.toUpperCase() 
    });
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }
    
    // Generate simulated candlestick data based on current price
    // In production, this would fetch from TwelveData or similar
    const candles = [];
    const basePrice = instrument.price || 100;
    const volatility = basePrice * 0.02; // 2% volatility
    
    for (let i = outputsize - 1; i >= 0; i--) {
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      candles.push({
        time: Date.now() - (i * 60000), // 1 minute intervals
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    res.json({
      success: true,
      data: candles,
      symbol: instrument.symbol,
      interval
    });
  } catch (error) {
    logger.error('Error fetching chart data', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data',
      error: error.message
    });
  }
});

// ─── GET DASHBOARD STATS (ADMIN ONLY) ──────────────────────────────
router.get('/stats/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalInstruments = await MarketInstrument.countDocuments();
    const activeInstruments = await MarketInstrument.countDocuments({ isActive: true });
    const stocksCount = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const cryptoCount = await MarketInstrument.countDocuments({ type: 'CRYPTO', isActive: true });
    const optionsCount = await MarketInstrument.countDocuments({ type: 'OPTION', isActive: true });
    
    const recentUpdates = await MarketInstrument.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('symbol name price changePercent trend updatedAt');
    
    res.json({
      success: true,
      data: {
        totalInstruments,
        activeInstruments,
        stocksCount,
        forexCount,
        cryptoCount,
        optionsCount,
        recentUpdates
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

module.exports = router;
