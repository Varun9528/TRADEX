const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Position = require('../models/Position');
const Stock = require('../models/Stock');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Place new order with margin support
router.post('/order', auth, async (req, res) => {
  try {
    const { symbol, quantity, price, orderType, productType, leverage = 1 } = req.body;
    
    // Get user with wallet info
    const user = await User.findById(req.user._id);
    if (!user.tradingEnabled || user.kycStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Trading not enabled or KYC not approved' });
    }

    // Get stock details
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    const marketPrice = stock.price;
    const orderValue = quantity * marketPrice;
    const requiredMargin = productType === 'MIS' ? orderValue / leverage : orderValue;

    // Check if user has sufficient balance
    if (requiredMargin > user.availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Required: ₹${requiredMargin.toFixed(2)}, Available: ₹${user.availableBalance.toFixed(2)}` 
      });
    }

    // Create order
    const order = new Order({
      user: user._id,
      symbol,
      quantity,
      price: orderType === 'MARKET' ? marketPrice : price,
      orderType,
      productType,
      side: 'BUY',
      status: 'PENDING',
      leverageUsed: leverage,
      requiredMargin,
      orderValue
    });

    await order.save();

    // Update position
    let position = await Position.findOne({ userId: user._id, symbol, isClosed: false });
    
    if (!position) {
      position = new Position({
        userId: user._id,
        symbol,
        quantity,
        averagePrice: marketPrice,
        currentPrice: marketPrice,
        leverageUsed: leverage,
        productType,
        investmentValue: orderValue,
        currentValue: orderValue,
        buyQuantity: quantity,
        netQuantity: quantity
      });
      await position.save();
    } else {
      // Add to existing position
      const totalCost = (position.quantity * position.averagePrice) + (quantity * marketPrice);
      const totalQty = position.quantity + quantity;
      
      position.quantity = totalQty;
      position.averagePrice = totalCost / totalQty;
      position.currentPrice = marketPrice;
      position.investmentValue += orderValue;
      position.currentValue = totalQty * marketPrice;
      position.buyQuantity += quantity;
      position.netQuantity += quantity;
      
      await position.save();
    }

    // Update user wallet
    user.usedMargin += requiredMargin;
    user.availableBalance -= requiredMargin;
    await user.save();

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'DEBIT',
      amount: requiredMargin,
      description: `Buy ${quantity} ${symbol} @ ₹${marketPrice}`,
      category: 'TRADE'
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order, position }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to place order' });
  }
});

// Get all orders for user
router.get('/orders', auth, async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel order
router.delete('/orders/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['CANCELLED', 'COMPLETE'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    order.status = 'CANCELLED';
    await order.save();

    // Release margin back
    if (order.requiredMargin) {
      const user = await User.findById(req.user._id);
      user.usedMargin -= order.requiredMargin;
      user.availableBalance += order.requiredMargin;
      await user.save();
    }

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Modify order
router.put('/orders/:orderId', auth, async (req, res) => {
  try {
    const { quantity, price } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!['PENDING', 'TRIGGER_PENDING'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify this order' });
    }

    if (quantity) order.quantity = quantity;
    if (price) order.price = price;
    
    await order.save();

    res.json({ success: true, message: 'Order modified successfully', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
