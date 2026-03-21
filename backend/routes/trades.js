const express = require('express');
const router = express.Router();
const { Order, Holding } = require('../models/Order');
const { Transaction } = require('../models/Transaction');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { Notification } = require('../models/Watchlist');
const { protect, requireKYC } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

router.use(protect);

// ── POST /api/trades/order ── Place order
router.post('/order', requireKYC, [
  body('symbol').notEmpty().toUpperCase(),
  body('transactionType').isIn(['BUY', 'SELL']),
  body('orderType').isIn(['MARKET', 'LIMIT', 'STOP_LOSS']),
  body('quantity').isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { symbol, transactionType, orderType, quantity, price, productType, exchange } = req.body;

    // Get stock
    const stock = await Stock.findOne({ symbol, isActive: true });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found or not tradable.' });

    const user = await User.findById(req.user._id);
    const executedPrice = orderType === 'MARKET' ? stock.currentPrice : price;
    const totalAmount = executedPrice * quantity;

    // ── BUY VALIDATION ──
    if (transactionType === 'BUY') {
      const brokerage = calculateBrokerage(totalAmount, transactionType, orderType);
      const taxes = calculateTaxes(totalAmount, transactionType);
      const netAmount = totalAmount + brokerage + taxes;

      if (user.walletBalance < netAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₹${netAmount.toFixed(2)}, Available: ₹${user.walletBalance.toFixed(2)}`
        });
      }

      // Deduct balance
      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore - netAmount;

      await User.findByIdAndUpdate(user._id, { walletBalance: balanceAfter });

      // Create transaction
      await Transaction.create({
        user: user._id,
        type: 'BUY_DEBIT',
        direction: 'DEBIT',
        amount: netAmount,
        balanceBefore,
        balanceAfter,
        description: `BUY ${quantity} shares of ${symbol} @ ₹${executedPrice.toFixed(2)}`,
        paymentMethod: 'INTERNAL',
        status: 'COMPLETED',
      });

      // Update or create holding
      await updateHolding(user._id, stock._id, symbol, 'BUY', quantity, executedPrice);

      // Create order
      const order = await Order.create({
        user: user._id,
        stock: stock._id,
        symbol,
        orderType,
        transactionType: 'BUY',
        productType: productType || 'DELIVERY',
        quantity,
        price: orderType === 'LIMIT' ? price : undefined,
        executedPrice,
        executedQuantity: quantity,
        totalAmount,
        brokerage,
        taxes,
        netAmount,
        status: 'COMPLETE',
        exchange: exchange || 'NSE',
        executedAt: new Date(),
      });

      // Notification
      await Notification.create({
        user: user._id,
        type: 'ORDER_EXECUTED',
        title: `Bought ${quantity} shares of ${symbol}`,
        message: `Order executed at ₹${executedPrice.toFixed(2)}. Total: ₹${netAmount.toFixed(2)}`,
        data: { orderId: order.orderId, symbol, quantity },
      });

      // Real-time push
      req.app.get('io')?.to(`user:${user._id}`).emit('order:executed', { order });

      return res.status(201).json({ success: true, message: 'Order placed and executed.', data: order });

    } else {
      // ── SELL VALIDATION ──
      const holding = await Holding.findOne({ user: user._id, symbol });
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient shares. You have ${holding?.quantity || 0} shares of ${symbol}.`
        });
      }

      const brokerage = calculateBrokerage(totalAmount, transactionType, orderType);
      const taxes = calculateTaxes(totalAmount, transactionType);
      const netAmount = totalAmount - brokerage - taxes;
      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore + netAmount;

      await User.findByIdAndUpdate(user._id, { walletBalance: balanceAfter });

      await Transaction.create({
        user: user._id, type: 'SELL_CREDIT', direction: 'CREDIT',
        amount: netAmount, balanceBefore, balanceAfter,
        description: `SELL ${quantity} shares of ${symbol} @ ₹${executedPrice.toFixed(2)}`,
        paymentMethod: 'INTERNAL', status: 'COMPLETED',
      });

      await updateHolding(user._id, stock._id, symbol, 'SELL', quantity, executedPrice);

      const order = await Order.create({
        user: user._id, stock: stock._id, symbol, orderType,
        transactionType: 'SELL', productType: productType || 'DELIVERY',
        quantity, executedPrice, executedQuantity: quantity,
        totalAmount, brokerage, taxes, netAmount,
        status: 'COMPLETE', exchange: exchange || 'NSE', executedAt: new Date(),
      });

      await Notification.create({
        user: user._id, type: 'ORDER_EXECUTED',
        title: `Sold ${quantity} shares of ${symbol}`,
        message: `Order executed at ₹${executedPrice.toFixed(2)}. Credited: ₹${netAmount.toFixed(2)}`,
        data: { orderId: order.orderId },
      });

      req.app.get('io')?.to(`user:${user._id}`).emit('order:executed', { order });
      return res.status(201).json({ success: true, message: 'Sell order executed.', data: order });
    }
  } catch (err) {
    logger.error('Place order error:', err);
    res.status(500).json({ success: false, message: 'Order placement failed.' });
  }
});

// ── GET /api/trades/orders ──
router.get('/orders', async (req, res) => {
  try {
    const { status, symbol, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (symbol) filter.symbol = symbol.toUpperCase();

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({ success: true, data: orders, pagination: { total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/trades/holdings ──
router.get('/holdings', async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user._id, quantity: { $gt: 0 } });

    // Enrich with current prices
    const symbols = holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } }).select('symbol currentPrice changePercent');
    const stockMap = {};
    stocks.forEach(s => { stockMap[s.symbol] = s; });

    const enriched = holdings.map(h => {
      const stock = stockMap[h.symbol];
      const currentPrice = stock?.currentPrice || h.avgBuyPrice;
      const currentValue = currentPrice * h.quantity;
      const pnl = currentValue - h.totalInvested;
      const pnlPercent = (pnl / h.totalInvested) * 100;
      return {
        ...h.toObject(),
        currentPrice, currentValue, pnl, pnlPercent,
        changePercent: stock?.changePercent || 0,
      };
    });

    const totalInvested = enriched.reduce((s, h) => s + h.totalInvested, 0);
    const totalCurrentValue = enriched.reduce((s, h) => s + h.currentValue, 0);
    const totalPnl = totalCurrentValue - totalInvested;

    res.json({
      success: true,
      data: { holdings: enriched, summary: { totalInvested, totalCurrentValue, totalPnl, totalPnlPercent: (totalPnl / totalInvested) * 100 } }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/trades/orders/:id ── Cancel order
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!['PENDING', 'OPEN'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled.' });
    }
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    await order.save();

    // Refund blocked amount for BUY orders
    if (order.transactionType === 'BUY') {
      const user = await User.findById(req.user._id);
      await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: order.netAmount } });
    }

    res.json({ success: true, message: 'Order cancelled.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── HELPERS ──
async function updateHolding(userId, stockId, symbol, type, qty, price) {
  const holding = await Holding.findOne({ user: userId, symbol });
  if (type === 'BUY') {
    if (holding) {
      const newQty = holding.quantity + qty;
      const newInvested = holding.totalInvested + qty * price;
      holding.quantity = newQty;
      holding.avgBuyPrice = newInvested / newQty;
      holding.totalInvested = newInvested;
      holding.lastBuyDate = new Date();
      await holding.save();
    } else {
      await Holding.create({ user: userId, stock: stockId, symbol, quantity: qty, avgBuyPrice: price, totalInvested: qty * price, firstBuyDate: new Date(), lastBuyDate: new Date() });
    }
  } else if (type === 'SELL' && holding) {
    holding.quantity -= qty;
    holding.totalInvested = holding.quantity * holding.avgBuyPrice;
    if (holding.quantity === 0) { await Holding.deleteOne({ _id: holding._id }); }
    else { await holding.save(); }
  }
}

function calculateBrokerage(amount, type, orderType) {
  if (orderType === 'MARKET') return Math.min(20, amount * 0.0003); // Max ₹20
  return Math.min(20, amount * 0.0003);
}

function calculateTaxes(amount, type) {
  const stt = amount * 0.001; // Securities Transaction Tax 0.1%
  const gst = calculateBrokerage(amount, type, 'MARKET') * 0.18;
  const stampDuty = amount * 0.00015;
  return stt + gst + stampDuty;
}

module.exports = router;
