const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Position = require('../models/Position');
const Stock = require('../models/Stock');

// Get all positions
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.query; // all, open, closed
    
    const query = { userId: req.user._id };
    if (type === 'open') query.isClosed = false;
    if (type === 'closed') query.isClosed = true;

    const positions = await Position.find(query).sort({ updatedAt: -1 });

    // Calculate P&L for each position
    const positionsWithPnl = positions.map(pos => ({
      ...pos.toObject(),
      unrealizedPnl: pos.currentValue - pos.investmentValue,
      pnlPercentage: ((pos.currentValue - pos.investmentValue) / pos.investmentValue * 100).toFixed(2)
    }));

    res.json({ success: true, count: positions.length, data: positionsWithPnl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Close position (square off)
router.post('/:symbol/close', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { quantity } = req.body;

    const position = await Position.findOne({ userId: req.user._id, symbol, isClosed: false });
    
    if (!position) {
      return res.status(404).json({ success: false, message: 'No open position found' });
    }

    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    const closeQty = quantity || position.quantity;
    const sellValue = closeQty * stock.price;
    const buyValue = (closeQty / position.quantity) * position.investmentValue;
    const pnl = sellValue - buyValue;

    // Update position
    position.sellQuantity += closeQty;
    position.netQuantity -= closeQty;
    position.realizedPnl += pnl;
    position.totalPnl = position.unrealizedPnl + position.realizedPnl;

    if (position.netQuantity <= 0) {
      position.isClosed = true;
      position.closedAt = new Date();
    }

    await position.save();

    // Update user wallet - release margin and add P&L
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    const marginToRelease = position.leverageUsed > 1 ? (buyValue / position.leverageUsed) : buyValue;
    user.usedMargin -= marginToRelease;
    user.availableBalance += marginToRelease + pnl;
    user.walletBalance += pnl;
    
    await user.save();

    // Create transaction
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      user: user._id,
      type: pnl >= 0 ? 'CREDIT' : 'DEBIT',
      amount: Math.abs(pnl),
      description: `Square off ${symbol}: P&L ₹${pnl.toFixed(2)}`,
      category: 'TRADE_PNL'
    });
    await transaction.save();

    res.json({ 
      success: true, 
      message: 'Position closed successfully',
      data: { position, pnl, sellValue }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
