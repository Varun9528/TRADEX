const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const { Order, Holding } = require('../models/Order');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { Transaction } = require('../models/Transaction');
const normalizeSymbol = require('../utils/normalizeSymbol');

// Place new order with margin support (BUY/SELL)
router.post('/order', auth, async (req, res) => {
  try {
    const { symbol, quantity, price, orderType, productType, transactionType = 'BUY', leverage = 1 } = req.body;
    
    // Validation: quantity must be > 0
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    
    // Get user with wallet info
    const user = await User.findById(req.user._id);
    if (!user.tradingEnabled || user.kycStatus !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: !user.tradingEnabled ? 'Trading disabled by admin' : 'KYC not approved' 
      });
    }

    // Get stock details
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    // Normalize symbol to NSE format (.NS suffix)
    const cleanSymbol = normalizeSymbol(symbol);
    
    console.log(`[DEBUG] Symbol normalization: "${symbol}" → "${cleanSymbol}"`);

    // SINGLE SOURCE OF TRUTH: Use provided price or fall back to stock price
    const executedPrice = price ? Number(price.toFixed(2)) : Number((stock.currentPrice || stock.price).toFixed(2));
    const orderValue = Number((executedPrice * quantity).toFixed(2));
    
    // Calculate required margin based on product type
    const requiredMargin = productType === 'MIS' ? Number((orderValue * 0.2).toFixed(2)) : orderValue;

    // Handle SELL transaction
    if (transactionType === 'SELL') {
      // Normalize symbol to NSE format (.NS suffix)
      const cleanSymbol = normalizeSymbol(symbol);
      
      console.log(`[DEBUG] Symbol normalization: "${symbol}" → "${cleanSymbol}"`);
      
      // Find existing holding
      let holding = await Holding.findOne({ 
        user: user._id, 
        symbol: cleanSymbol,
        quantity: { $gt: 0 }
      });
      
      // SHORT SELLING LOGIC
      // Allow short sell only for MIS (intraday) when no holding exists
      if (!holding) {
        if (productType !== 'MIS') {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot sell without holdings for ${productType}. Please buy first or use MIS for intraday short selling.` 
          });
        }
        
        // Create short position for MIS
        console.log(`[SHORT SELL] Creating short position for ${cleanSymbol} (MIS)`);
        
        // Calculate P&L will be handled at square-off
        const pnl = 0; // Will be calculated when position is closed
        
        // Update user wallet - block margin for short sell (100% for safety)
        const marginRequired = Number((executedPrice * quantity).toFixed(2));
        if (marginRequired > user.availableBalance) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient balance for short sell. Required: ₹${marginRequired}, Available: ₹${user.availableBalance}` 
          });
        }
        
        user.usedMargin += marginRequired;
        user.availableBalance -= marginRequired;
        
        console.log(`[SHORT SELL] Margin blocked: ₹${marginRequired}`);
        
        await user.save();
        
        // Create order record for short sell
        const order = new Order({
          user: user._id,
          stock: stock._id,
          symbol: cleanSymbol,
          quantity,
          price: executedPrice,
          orderType: 'MARKET',
          productType,
          transactionType: 'SELL',
          side: 'SELL',
          status: 'COMPLETE',
          executedPrice,
          executedQty: quantity,
          pnl,
          orderValue,
          requiredMargin: marginRequired,
        });
        await order.save();
        
        // Create transaction
        const transaction = new Transaction({
          user: user._id,
          type: 'SHORT_SELL',
          direction: 'CREDIT',
          amount: marginRequired,
          balanceBefore: user.walletBalance + marginRequired,
          balanceAfter: user.walletBalance,
          description: `Short sold ${quantity} ${symbol} @ ₹${executedPrice} (MIS - Square off required)`,
          orderId: order._id,
          reference: `SHORT-${symbol}-${Date.now()}`
        });
        await transaction.save();
        
        return res.status(200).json({
          success: true,
          message: 'Short sell order executed successfully. Position will be auto-squared off.',
          data: { order, shortSell: true, marginBlocked: marginRequired }
        });
      }
      
      // NORMAL SELL - When holding exists
      if (holding.quantity < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient position. You have ${holding.quantity} shares, trying to sell ${quantity}` 
        });
      }

      // Calculate P&L using consistent executed price
      const pnl = Number(((executedPrice - holding.avgBuyPrice) * quantity).toFixed(2));
      
      // Calculate sell value (full amount from selling shares)
      const sellValue = Number((executedPrice * quantity).toFixed(2));
      
      // For MIS orders: Release the margin that was locked during BUY
      let marginReleased = 0;
      if (productType === 'MIS') {
        // Calculate how much margin was originally used (20% of buy value)
        const originalMarginUsed = Number((holding.avgBuyPrice * quantity * 0.2).toFixed(2));
        marginReleased = originalMarginUsed;
        
        // Release the margin back to available balance (with safety check)
        user.usedMargin = Math.max(0, Number((user.usedMargin - originalMarginUsed).toFixed(2)));
        user.availableBalance += originalMarginUsed;
        
        console.log(`[SELL MARGIN] Released: ₹${marginReleased}, New usedMargin: ₹${user.usedMargin}`);
      }
      
      // Add P&L to wallet (profit or loss)
      user.walletBalance += pnl;
      
      console.log(`[SELL DEBUG] PnL: ₹${pnl}, Margin Released: ₹${marginReleased}, Wallet Balance: ₹${user.walletBalance}`);
      
      await user.save();

      // Update holding
      holding.quantity -= quantity;
      
      if (holding.quantity === 0) {
        // Optionally delete or mark as closed
        holding.avgBuyPrice = 0;
        holding.totalInvested = 0;
      }
      
      await holding.save();

      // Create order record with CLEAN symbol (.NS format) and fixed price variable
      const order = new Order({
        user: user._id,
        stock: stock._id,
        symbol: cleanSymbol,  // ✅ NSE format (.NS)
        quantity,
        price: executedPrice,  // ✅ Fixed: Use executedPrice
        orderType: 'MARKET',
        productType,
        transactionType: 'SELL',
        side: 'SELL',
        status: 'COMPLETE',
        executedPrice,  // ✅ Fixed: Use executedPrice
        executedQty: quantity,
        pnl,
        orderValue,
        requiredMargin,
      });
      await order.save();

      // Create transaction for SELL with consistent price
      const balanceBefore = user.walletBalance;
      const balanceAfter = pnl >= 0 ? balanceBefore + Math.abs(pnl) : balanceBefore - Math.abs(pnl);
      
      const transaction = new Transaction({
        user: user._id,
        type: pnl >= 0 ? 'SELL_CREDIT' : 'BUY_DEBIT',
        direction: pnl >= 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(pnl),
        balanceBefore,
        balanceAfter,
        description: `${pnl >= 0 ? 'Profit' : 'Loss'} from selling ${quantity} ${symbol} @ ₹${executedPrice}`,
        orderId: order._id,
        reference: `SELL-${symbol}-${Date.now()}`
      });
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Sell order executed successfully',
        data: { order, pnl, soldQuantity: quantity }
      });
    }

    // BUY transaction
    // Check if user has sufficient balance
    if (requiredMargin > user.availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Required: ₹${requiredMargin.toFixed(2)}, Available: ₹${user.availableBalance.toFixed(2)}` 
      });
    }

    // Create order with CLEAN symbol (.NS format) and consistent executed price
    const order = new Order({
      user: user._id,
      stock: stock._id,
      symbol: cleanSymbol,  // ✅ NSE format (.NS)
      quantity,
      price: executedPrice,
      orderType,
      productType,
      transactionType: 'BUY',
      side: 'BUY',
      status: 'COMPLETE',
      executedPrice,
      executedQty: quantity,
      leverageUsed: leverage,
      requiredMargin,
      orderValue
    });

    await order.save();

    // Update or create position (Holding) with CLEAN symbol (.NS format)
    let holding = await Holding.findOne({ 
      user: user._id, 
      symbol: cleanSymbol  // ✅ NSE format (.NS)
    });
    
    if (!holding) {
      // Create new holding with CLEAN symbol (.NS format) and consistent price
      holding = new Holding({
        user: user._id,
        stock: stock._id,
        symbol: cleanSymbol,  // ✅ NSE format (.NS)
        quantity,
        avgBuyPrice: executedPrice,
        totalInvested: orderValue,
        productType: productType === 'CNC' ? 'DELIVERY' : 'MTF',
        firstBuyDate: new Date(),
        lastBuyDate: new Date(),
      });
      await holding.save();
    } else {
      // Add to existing holding - calculate new average price using consistent price
      const oldCost = Number((holding.quantity * holding.avgBuyPrice).toFixed(2));
      const newCost = Number((quantity * executedPrice).toFixed(2));
      const totalQty = holding.quantity + quantity;
      const totalCost = oldCost + newCost;
      
      holding.quantity = totalQty;
      holding.avgBuyPrice = Number((totalCost / totalQty).toFixed(2));
      holding.totalInvested = totalCost;
      holding.lastBuyDate = new Date();
      
      await holding.save();
    }

    // Update user wallet - deduct margin for MIS, full amount for CNC
    const balanceBefore = user.walletBalance;
    const deductionAmount = requiredMargin; // Use already calculated margin (MIS=20%, CNC=100%)
    const balanceAfter = balanceBefore - deductionAmount;
    user.walletBalance = balanceAfter;
    user.availableBalance = balanceAfter;
    await user.save();

    // Create transaction for BUY with correct deduction amount
    const transaction = new Transaction({
      user: user._id,
      type: 'BUY_DEBIT',
      direction: 'DEBIT',
      amount: deductionAmount,
      balanceBefore,
      balanceAfter,
      description: `Bought ${quantity} ${symbol} @ ₹${executedPrice}`,
      orderId: order._id,
      reference: `BUY-${symbol}-${Date.now()}`
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Buy order executed successfully',
      data: { 
        order, 
        holding,
        executedPrice,
        orderValue,
        marginUsed: requiredMargin,
        walletBalance: balanceAfter
      }
    });

  } catch (err) {
    console.error('[Trade Route] Error:', err);
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

// Get user's portfolio/holdings
router.get('/portfolio', auth, async (req, res) => {
  try {
    // Get all holdings for user
    const holdings = await Holding.find({ user: req.user._id, quantity: { $gt: 0 } })
      .populate('stock', 'symbol name sector logo currentPrice change changePercent');
    
    // Calculate current value and P&L for each holding
    const portfolio = holdings.map(holding => {
      const stock = holding.stock;
      const currentPrice = stock?.currentPrice || 0;
      const currentValue = holding.quantity * currentPrice;
      const pnl = currentValue - holding.totalInvested;
      const pnlPercent = ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100;
      
      return {
        _id: holding._id,
        symbol: holding.symbol,
        name: stock?.name || '',
        sector: stock?.sector || '',
        logo: stock?.logo || '📊',
        quantity: holding.quantity,
        avgBuyPrice: holding.avgBuyPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent,
        productType: holding.productType,
        firstBuyDate: holding.firstBuyDate,
        lastBuyDate: holding.lastBuyDate,
      };
    });
    
    // Calculate totals
    const totalInvested = portfolio.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalCurrentValue = portfolio.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPnl = totalCurrentValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        holdings: portfolio,
        summary: {
          totalInvested,
          totalCurrentValue,
          totalPnl,
          totalPnlPercent,
          count: portfolio.length
        }
      }
    });
  } catch (err) {
    console.error('[Portfolio Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/trades/holdings - Get user's holdings
router.get('/holdings', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: holdings
    });
  } catch (err) {
    console.error('[Holdings Error]:', err);
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
