const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const MarketInstrument = require('../models/MarketInstrument');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/admin/place-order-for-user
router.post('/place-order-for-user', protect, adminOnly, async (req, res) => {
  try {
    const { userId, symbol, quantity, transactionType = 'BUY' } = req.body;

    console.log('[Admin Trade] REQUEST RECEIVED:', req.body);

    // Validation
    if (!userId || !symbol || !quantity || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, symbol, quantity, transactionType'
      });
    }

    // Find instrument
    const instrument = await MarketInstrument.findOne({
      symbol: symbol.trim()
    });

    if (!instrument) {
      console.log('[Admin Trade] Instrument not found:', symbol);
      
      // Show available instruments for debugging
      const sampleInstruments = await MarketInstrument.find().limit(5).select('symbol name');
      console.log('[Admin Trade] Available instruments:', sampleInstruments);
      
      return res.status(404).json({
        success: false,
        message: `Instrument not found: ${symbol}. Please select from dropdown.`
      });
    }

    console.log('[Admin Trade] Found instrument:', instrument.symbol, instrument.name);

    // Get user to check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate order value
    const price = instrument.price || instrument.currentPrice || 100;
    const orderValue = price * Number(quantity);

    // Check balance for BUY orders
    if (transactionType === 'BUY') {
      if (orderValue > user.availableBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₹${orderValue.toFixed(2)}, Available: ₹${user.availableBalance.toFixed(2)}`
        });
      }

      // Deduct from wallet
      user.walletBalance -= orderValue;
      user.availableBalance -= orderValue;
      await user.save();
      
      console.log('[Admin Trade] Deducted ₹', orderValue, 'from user wallet');
    }

    // Create order
    const order = await Order.create({
      user: userId,
      stock: instrument._id,  // Order model uses 'stock' field
      symbol: instrument.symbol,
      orderType: 'MARKET',
      transactionType,
      productType: 'CNC',
      quantity: Number(quantity),
      price: price,
      executedPrice: price,
      executedQuantity: Number(quantity),
      totalAmount: orderValue,
      netAmount: orderValue,
      status: 'COMPLETE',
      executedAt: new Date(),
      placedBy: 'ADMIN',
      adminId: req.user._id,
    });

    console.log('[Admin Trade] ORDER CREATED:', order._id);

    // If BUY, create/update holding
    if (transactionType === 'BUY') {
      const { Holding } = require('../models/Order');
      
      let holding = await Holding.findOne({ 
        user: userId, 
        symbol: instrument.symbol 
      });

      if (holding) {
        // Update existing holding
        const totalQty = holding.quantity + Number(quantity);
        const totalCost = (holding.avgBuyPrice * holding.quantity) + orderValue;
        holding.avgBuyPrice = Number((totalCost / totalQty).toFixed(2));
        holding.quantity = totalQty;
        holding.totalInvested = Number((holding.avgBuyPrice * totalQty).toFixed(2));
        holding.lastBuyDate = new Date();
        await holding.save();
        
        console.log('[Admin Trade] Updated existing holding');
      } else {
        // Create new holding
        await Holding.create({
          user: userId,
          stock: instrument._id,
          symbol: instrument.symbol,
          quantity: Number(quantity),
          avgBuyPrice: price,
          totalInvested: orderValue,
          productType: 'DELIVERY',
          firstBuyDate: new Date(),
          lastBuyDate: new Date(),
        });
        
        console.log('[Admin Trade] Created new holding');
      }
    }
    
    // If SELL, reduce holding (allow negative for testing)
    if (transactionType === 'SELL') {
      const { Holding } = require('../models/Order');
      
      let holding = await Holding.findOne({ 
        user: userId, 
        symbol: instrument.symbol 
      });

      if (holding) {
        // Reduce quantity (can go negative for testing)
        holding.quantity -= Number(quantity);
        holding.totalInvested = Math.max(0, holding.totalInvested - orderValue);
        await holding.save();
        
        console.log('[Admin Trade] Reduced holding quantity:', holding.quantity);
      } else {
        // Create negative holding for testing (short selling)
        await Holding.create({
          user: userId,
          stock: instrument._id,
          symbol: instrument.symbol,
          quantity: -Number(quantity),  // Negative for short sell
          avgBuyPrice: price,
          totalInvested: 0,
          productType: 'DELIVERY',
          firstBuyDate: new Date(),
          lastBuyDate: new Date(),
        });
        
        console.log('[Admin Trade] Created negative holding (short sell)');
      }
      
      // Add money back to wallet for SELL
      user.walletBalance += orderValue;
      user.availableBalance += orderValue;
      await user.save();
      
      console.log('[Admin Trade] Added ₹', orderValue, 'to user wallet from SELL');
    }

    // Create transaction record
    const { Transaction } = require('../models/Transaction');
    
    // Calculate balance before and after
    const balanceBefore = transactionType === 'BUY' 
      ? user.availableBalance + orderValue  // Before BUY, balance was higher
      : user.availableBalance - orderValue; // Before SELL, balance was lower
    
    const balanceAfter = user.availableBalance;

    await Transaction.create({
      user: userId,
      type: transactionType === 'BUY' ? 'BUY_DEBIT' : 'SELL_CREDIT',
      direction: transactionType === 'BUY' ? 'DEBIT' : 'CREDIT',
      amount: orderValue,
      balanceBefore,
      balanceAfter,
      description: `${transactionType} ${quantity} ${instrument.symbol} @ ₹${price} (Placed by Admin)`,
      orderId: order._id,
      paymentMethod: 'INTERNAL',
      status: 'COMPLETED',
      metadata: {
        symbol: instrument.symbol,
        quantity: Number(quantity),
        price: price,
        placedBy: 'ADMIN',
        adminId: req.user._id,
      },
    });

    // Notify user
    const Notification = require('../models/Notification');
    await Notification.create({
      user: userId,
      type: 'ORDER_EXECUTED',
      priority: 'HIGH',
      title: 'Order Executed by Admin',
      message: `Admin placed ${transactionType} order for ${quantity} ${instrument.symbol} @ ₹${price}`,
      entityType: 'ORDER',
      entityId: order._id,
      metadata: {
        placedBy: 'ADMIN',
        adminId: req.user._id,
      },
    });

    console.log('[Admin Trade] Transaction and notification created');

    res.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        orderId: order.orderId,
        symbol: order.symbol,
        quantity: order.quantity,
        price: order.price,
        transactionType: order.transactionType,
        placedBy: order.placedBy,
        status: order.status,
      }
    });

  } catch (err) {
    console.error('[Admin Trade] ERROR:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

module.exports = router;
