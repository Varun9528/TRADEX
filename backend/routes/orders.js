const express = require('express');
const router = express.Router();
const { Order } = require('../models/Order');
const { protect } = require('../middleware/auth');
const { normalizeSymbol } = require('../utils/symbols');

router.use(protect);

// GET /api/orders — paginated order history
router.get('/', async (req, res) => {
  try {
    const { status, type, symbol, from, to, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status.toUpperCase();
    if (type) filter.transactionType = type.toUpperCase();
    if (symbol) filter.symbol = normalizeSymbol(symbol);  // ✅ Normalize symbol for consistent lookup
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).limit(+limit).skip((+page - 1) * +limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:orderId
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
