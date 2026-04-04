const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Order, Holding } = require('../models/Order');
const Stock = require('../models/Stock');
const Position = require('../models/Position');
const { Transaction } = require('../models/Transaction');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const normalizeSymbol = require('../utils/normalizeSymbol');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.use(protect);
router.use(isAdmin);

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      kycStatus = 'all',
      tradingEnabled = 'all'
    } = req.query;
    
    const query = {};
    
    // Search by name, email, mobile, clientId
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by KYC status
    if (kycStatus !== 'all') {
      query.kycStatus = kycStatus;
    }
    
    // Filter by trading enabled status
    if (tradingEnabled !== 'all') {
      query.tradingEnabled = tradingEnabled === 'true';
    }
    
    const users = await User.find(query)
      .select('-password -refreshToken -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: +page,
        pages: Math.ceil(total / +limit)
      }
    });
  } catch (err) {
    console.error('[Admin Users Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/toggle-trading/:userId - Enable/disable trading for user
router.patch('/toggle-trading/:userId', async (req, res) => {
  try {
    const { enabled } = req.body; // true or false
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide enabled as boolean (true/false)' 
      });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update trading enabled status
    user.tradingEnabled = enabled;
    await user.save();
    
    // Create notification for user
    await Notification.create({
      user: user._id,
      type: enabled ? 'TRADING_ENABLED' : 'TRADING_DISABLED',
      priority: 'HIGH',
      title: enabled ? 'Trading Enabled' : 'Trading Disabled',
      message: enabled 
        ? `Your trading permissions have been enabled by admin. You can now place buy/sell orders.`
        : `Your trading permissions have been disabled by admin. You cannot place new buy/sell orders until re-enabled.`,
      entityType: 'USER',
      entityId: user._id,
      metadata: {
        tradingEnabled: enabled,
        updatedBy: req.user._id
      }
    });
    
    res.json({
      success: true,
      message: `Trading ${enabled ? 'enabled' : 'disabled'} successfully for ${user.fullName}`,
      data: {
        userId: user._id,
        tradingEnabled: enabled
      }
    });
  } catch (err) {
    console.error('[Toggle Trading Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/user/:userId - Get single user details
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -refreshToken -otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/place-order-for-user - Admin places order on behalf of user
router.post('/place-order-for-user', protect, isAdmin, async (req, res) => {
  try {
    const { userId, symbol, quantity, price, orderType = 'MARKET', productType = 'CNC', transactionType = 'BUY' } = req.body;
    
    // Validation
    if (!userId || !symbol || !quantity || !transactionType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, symbol, quantity, transactionType' 
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }
    
    // Get target user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get instrument from MarketInstrument (not Stock)
    const MarketInstrument = require('../models/MarketInstrument');
    
    // Try multiple symbol formats to handle mismatches
    const normalizedSymbol = normalizeSymbol(symbol);
    console.log('[Admin Trade] Searching for instrument:', {
      original: symbol,
      normalized: normalizedSymbol,
      withNS: `${normalizedSymbol}.NS`
    });
    
    const instrument = await MarketInstrument.findOne({
      $or: [
        { symbol: symbol.trim() },                    // Exact match
        { symbol: normalizedSymbol },                 // Normalized (without .NS)
        { symbol: `${normalizedSymbol}.NS` },         // With .NS suffix
        { symbol: symbol.toUpperCase().trim() },      // Uppercase
      ]
    });
    
    if (!instrument) {
      console.log('[Admin Trade] Instrument not found. Available symbols in DB:');
      const sampleInstruments = await MarketInstrument.find().limit(5).select('symbol');
      console.log(sampleInstruments.map(i => i.symbol));
      
      return res.status(404).json({ 
        success: false, 
        message: `Instrument not found: ${symbol}. Please select from dropdown.` 
      });
    }
    
    console.log('[Admin Trade] Found instrument:', instrument.symbol, instrument.name);
    
    // Calculate price
    const executedPrice = price ? Number(price) : Number(instrument.price || instrument.currentPrice || 0);
    const orderValue = Number((executedPrice * quantity).toFixed(2));
    
    // Check balance for BUY orders
    if (transactionType === 'BUY') {
      if (orderValue > user.availableBalance) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient balance. Required: ₹${orderValue}, Available: ₹${user.availableBalance}` 
        });
      }
      
      // Deduct from wallet
      user.walletBalance -= orderValue;
      user.availableBalance -= orderValue;
      await user.save();
    }
    
    // Create order with placedBy = ADMIN
    const order = new Order({
      user: user._id,
      stock: instrument._id,
      symbol: normalizeSymbol(symbol),
      orderType,
      transactionType,
      productType,
      quantity,
      price: executedPrice,
      executedPrice,
      executedQuantity: quantity,
      totalAmount: orderValue,
      netAmount: orderValue,
      status: 'COMPLETE',
      executedAt: new Date(),
      placedBy: 'ADMIN',
      adminId: req.user._id, // The admin who placed the order
    });
    
    await order.save();
    
    // If BUY, create/update holding
    if (transactionType === 'BUY') {
      let holding = await Holding.findOne({ user: user._id, symbol: normalizeSymbol(symbol) });
      
      if (holding) {
        // Update existing holding
        const totalQty = holding.quantity + quantity;
        const totalCost = (holding.avgBuyPrice * holding.quantity) + orderValue;
        holding.avgBuyPrice = Number((totalCost / totalQty).toFixed(2));
        holding.quantity = totalQty;
        holding.totalInvested = Number((holding.avgBuyPrice * totalQty).toFixed(2));
        holding.lastBuyDate = new Date();
        await holding.save();
      } else {
        // Create new holding
        await Holding.create({
          user: user._id,
          stock: instrument._id,
          symbol: normalizeSymbol(symbol),
          quantity,
          avgBuyPrice: executedPrice,
          totalInvested: orderValue,
          productType: 'DELIVERY',
          firstBuyDate: new Date(),
          lastBuyDate: new Date(),
        });
      }
    }
    
    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: transactionType === 'BUY' ? 'DEBIT' : 'CREDIT',
      category: 'TRADE',
      amount: orderValue,
      description: `${transactionType} ${quantity} ${normalizeSymbol(symbol)} @ ₹${executedPrice} (Placed by Admin)`,
      balanceAfter: user.availableBalance,
      orderId: order._id,
      metadata: {
        symbol: normalizeSymbol(symbol),
        quantity,
        price: executedPrice,
        placedBy: 'ADMIN',
        adminId: req.user._id,
      },
    });
    
    // Notify user
    await Notification.create({
      user: user._id,
      type: 'ORDER_EXECUTED',
      priority: 'HIGH',
      title: `Order Executed by Admin`,
      message: `Admin placed ${transactionType} order for ${quantity} ${normalizeSymbol(symbol)} @ ₹${executedPrice}`,
      entityType: 'ORDER',
      entityId: order._id,
      metadata: {
        symbol: normalizeSymbol(symbol),
        quantity,
        price: executedPrice,
        transactionType,
        placedBy: 'ADMIN',
      },
    });
    
    res.json({
      success: true,
      message: `Order placed successfully for ${user.fullName}`,
      data: {
        orderId: order.orderId,
        symbol: normalizeSymbol(symbol),
        quantity,
        price: executedPrice,
        transactionType,
        placedBy: 'ADMIN',
      },
    });
  } catch (err) {
    console.error('[Admin Place Order Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
