// ═══════════════════════════════════════
// STOCKS ROUTES
// ═══════════════════════════════════════
const express = require('express');
const stockRouter = express.Router();
const Stock = require('../models/Stock');
const { protect } = require('../middleware/auth');

stockRouter.use(protect);

// GET /api/stocks — All stocks
stockRouter.get('/', async (req, res) => {
  try {
    const { sector, search, page = 1, limit = 50, sort = '-marketCap' } = req.query;
    const filter = { isActive: true };
    if (sector) filter.sector = sector;
    if (search) filter.$or = [{ symbol: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }];
    const stocks = await Stock.find(filter).sort(sort).limit(+limit).skip((+page - 1) * +limit)
      .select('symbol name sector logo currentPrice previousClose change changePercent volume marketCap weekHigh52 weekLow52');
    const total = await Stock.countDocuments(filter);
    res.json({ success: true, data: stocks, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stocks/:symbol — Single stock with history
stockRouter.get('/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, data: stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stocks/:symbol/history — Price history
stockRouter.get('/:symbol/history', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() }).select('symbol priceHistory currentPrice');
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, data: { symbol: stock.symbol, history: stock.priceHistory } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stocks/indices/live — Market indices
stockRouter.get('/meta/indices', async (req, res) => {
  res.json({
    success: true, data: {
      nifty50: { value: 24352 + (Math.random() - 0.5) * 100, change: 0.42 },
      sensex: { value: 79841 + (Math.random() - 0.5) * 300, change: 0.38 },
      bankNifty: { value: 51243 + (Math.random() - 0.5) * 200, change: -0.12 },
      niftyIT: { value: 38421 + (Math.random() - 0.5) * 150, change: 1.24 },
    }
  });
});

module.exports = stockRouter;
