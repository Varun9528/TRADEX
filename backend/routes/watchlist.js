const express = require('express');
const router = express.Router();
const { Watchlist } = require('../models/Watchlist');
const MarketInstrument = require('../models/MarketInstrument');
const { protect } = require('../middleware/auth');
const { normalizeSymbol } = require('../utils/symbols');

router.use(protect);

// GET /api/watchlist
router.get('/', async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      // Return empty array instead of crashing
      return res.json({ success: true, data: [] });
    }

    const symbols = watchlist.stocks.map(s => s.symbol);
    
    // Use MarketInstrument instead of Stock
    const instruments = await MarketInstrument.find({ 
      symbol: { $in: symbols },
      isActive: true 
    }).select('symbol name type exchange price changePercent volume sector');

    const instrumentMap = {};
    instruments.forEach(inst => { 
      instrumentMap[inst.symbol] = inst; 
    });

    const enriched = watchlist.stocks
      .filter(ws => instrumentMap[ws.symbol]) // Only include instruments that exist
      .map(ws => ({
        ...ws.toObject(),
        instrumentData: instrumentMap[ws.symbol] || null,
      }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[Watchlist API] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/watchlist/add
router.post('/add', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol required.' });

    // Use MarketInstrument instead of Stock
    const instrument = await MarketInstrument.findOne({ 
      symbol: normalizeSymbol(symbol), 
      isActive: true 
    });
    
    if (!instrument) {
      return res.status(404).json({ success: false, message: 'Instrument not found.' });
    }

    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) watchlist = new Watchlist({ user: req.user._id, stocks: [] });

    const already = watchlist.stocks.find(s => s.symbol === normalizeSymbol(symbol));
    if (already) return res.status(409).json({ success: false, message: 'Stock already in watchlist.' });

    if (watchlist.stocks.length >= 50) {
      return res.status(400).json({ success: false, message: 'Watchlist limit is 50 instruments.' });
    }

    watchlist.stocks.push({ symbol: normalizeSymbol(symbol) });
    await watchlist.save();

    res.json({ success: true, message: `${symbol} added to watchlist.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', async (req, res) => {
  try {
    const sym = normalizeSymbol(req.params.symbol);
    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ success: false, message: 'Watchlist not found.' });

    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== sym);
    await watchlist.save();

    res.json({ success: true, message: `${sym} removed from watchlist.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/watchlist/:symbol/alert — Set price alert
router.patch('/:symbol/alert', async (req, res) => {
  try {
    const sym = normalizeSymbol(req.params.symbol);
    const { alertPrice } = req.body;

    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ success: false, message: 'Watchlist not found.' });

    const item = watchlist.stocks.find(s => s.symbol === sym);
    if (!item) return res.status(404).json({ success: false, message: 'Stock not in watchlist.' });

    item.alertPrice = alertPrice;
    await watchlist.save();

    res.json({ success: true, message: `Price alert set for ${sym} at ₹${alertPrice}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
