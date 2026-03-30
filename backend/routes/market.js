const express = require('express');
const router = express.Router();
const MarketInstrument = require('../models/MarketInstrument');
const { protect, adminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

// ─── GET ALL MARKET INSTRUMENTS ──────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type = 'all', exchange = 'all', status = 'active', search = '', limit = 100 } = req.query;
    
    const query = {};
    
    // Filter by type
    if (type !== 'all') {
      query.type = type;
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
    
    const instruments = await MarketInstrument.find(query)
      .sort({ volume: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: instruments,
      count: instruments.length
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
      type,
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
    
    logger.info(`Instrument created: ${symbol} by admin ${req.user.email}`);
    
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
        instrument[field] = req.body[field];
      }
    });
    
    await instrument.save();
    
    logger.info(`Instrument updated: ${instrument.symbol} by admin ${req.user.email}`);
    
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

// ─── GET DASHBOARD STATS (ADMIN ONLY) ──────────────────────────────
router.get('/stats/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalInstruments = await MarketInstrument.countDocuments();
    const activeInstruments = await MarketInstrument.countDocuments({ isActive: true });
    const stocksCount = await MarketInstrument.countDocuments({ type: 'STOCK', isActive: true });
    const forexCount = await MarketInstrument.countDocuments({ type: 'FOREX', isActive: true });
    const cryptoCount = await MarketInstrument.countDocuments({ type: 'CRYPTO', isActive: true });
    
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
