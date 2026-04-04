const express = require('express');
const router = express.Router();
const User = require('../models/User');
const KYC = require('../models/KYC');
const Stock = require('../models/Stock');
const { Order, Holding } = require('../models/Order');
const Position = require('../models/Position');
const { Transaction, Withdrawal } = require('../models/Transaction');
const Notification = require('../models/Notification');
const FundRequest = require('../models/FundRequest');  // ✅ Added for fund/withdraw requests
const { protect, adminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(protect, adminOnly);

// ── GET /api/admin/dashboard ──
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, kycPending, kycApproved,
      totalOrders, todayOrders, totalDeposits, pendingWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ kycStatus: 'pending' }),
      User.countDocuments({ kycStatus: 'approved' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Transaction.aggregate([{ $match: { type: 'DEPOSIT', status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.countDocuments({ status: 'PENDING' }),
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, role: 'user' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, kycPending, kycApproved },
        trading: { totalOrders, todayOrders },
        finance: { totalDeposits: totalDeposits[0]?.total || 0, pendingWithdrawals },
        recentSignups,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ──
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, kycStatus, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (search) filter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { mobile: new RegExp(search, 'i') },
      { clientId: new RegExp(search, 'i') },
    ];

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).limit(+limit).skip((+page - 1) * +limit)
        .select('-refreshToken -password -otp'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, pagination: { total, page: +page, pages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/status ── Activate/deactivate user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}.`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/trading ── Enable/disable trading for user
router.patch('/users/:id/trading', async (req, res) => {
  try {
    const { tradingEnabled } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { tradingEnabled }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    // Send notification to user
    await Notification.create({
      user: user._id,
      type: 'SYSTEM',
      title: tradingEnabled ? 'Trading Enabled' : 'Trading Disabled',
      message: tradingEnabled 
        ? 'Your trading has been enabled by admin. You can now place orders.'
        : 'Your trading has been disabled by admin. You cannot place new orders.',
      priority: 'HIGH'
    });
    
    res.json({ success: true, message: `User trading ${tradingEnabled ? 'enabled' : 'disabled'}.`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/trade ── Admin places trade on behalf of user
router.post('/trade', async (req, res) => {
  try {
    const { userId, symbol, quantity, price, transactionType = 'BUY', productType = 'CNC' } = req.body;
    
    // Get user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Get stock
    const stock = await Stock.findOne({ symbol });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    
    const marketPrice = price || stock.currentPrice || stock.price;
    const orderValue = quantity * marketPrice;
    
    // Create order
    const order = new Order({
      user: user._id,
      stock: stock._id,
      symbol,
      quantity,
      price: marketPrice,
      orderType: 'MARKET',
      productType,
      transactionType,
      side: transactionType,
      status: 'COMPLETE',
      executedPrice: marketPrice,
      executedQty: quantity,
      orderValue,
      placedBy: 'ADMIN'
    });
    
    await order.save();
    
    // Handle BUY or SELL
    if (transactionType === 'SELL') {
      // Check if user has position
      const position = await Position.findOne({ 
        userId: user._id, 
        symbol, 
        isClosed: false,
        netQuantity: { $gt: 0 }
      });
      
      if (!position || position.netQuantity < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient position. User has ${position?.netQuantity || 0} shares` 
        });
      }
      
      // Calculate P&L
      const pnl = (marketPrice - position.averagePrice) * quantity;
      
      // Update position
      position.sellQuantity += quantity;
      position.netQuantity -= quantity;
      
      if (position.netQuantity === 0) {
        position.isClosed = true;
        position.closedAt = new Date();
        position.totalPnl = pnl;
      }
      
      await position.save();
      
      // Update user wallet
      user.walletBalance += pnl;
      await user.save();
      
      // Notify user
      await Notification.create({
        user: user._id,
        type: 'TRADE',
        title: 'Admin Placed SELL Order',
        message: `Admin sold ${quantity} ${symbol} @ ₹${marketPrice}. P&L: ₹${pnl.toFixed(2)}`,
        priority: 'MEDIUM'
      });
      
      return res.json({
        success: true,
        message: 'Sell order placed successfully',
        data: { order, position, pnl }
      });
    }
    
    // BUY transaction
    let position = await Position.findOne({ userId: user._id, symbol, isClosed: false });
    
    if (!position) {
      position = new Position({
        userId: user._id,
        stock: stock._id,
        symbol,
        quantity,
        averagePrice: marketPrice,
        currentPrice: marketPrice,
        productType,
        investmentValue: orderValue,
        currentValue: orderValue,
        buyQuantity: quantity,
        sellQuantity: 0,
        netQuantity: quantity,
        transactionType: 'BUY',
      });
      await position.save();
    } else {
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
    
    // Notify user
    await Notification.create({
      user: user._id,
      type: 'TRADE',
      title: 'Admin Placed BUY Order',
      message: `Admin bought ${quantity} ${symbol} @ ₹${marketPrice}`,
      priority: 'MEDIUM'
    });
    
    res.json({
      success: true,
      message: `Trade placed successfully for ${user.fullName}`,
      data: { order, position }
    });
  } catch (err) {
    console.error('[Admin Trade] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/kyc ── All KYC submissions
router.get('/kyc', async (req, res) => {
  try {
    const { status = 'submitted', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;

    const kycs = await KYC.find(filter)
      .populate('user', 'fullName email mobile clientId createdAt')
      .sort({ submittedAt: -1 })
      .limit(+limit).skip((+page - 1) * +limit);

    const total = await KYC.countDocuments(filter);
    res.json({ success: true, data: kycs, pagination: { total, page: +page, pages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/kyc/:userId ── KYC details with document URLs
router.get('/kyc/:userId', async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.params.userId }).populate('user', 'fullName email mobile clientId');
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found.' });
    res.json({ success: true, data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/kyc/:userId/review ── Approve or reject KYC
router.patch('/kyc/:userId/review', async (req, res) => {
  try {
    const { action, reason, notes } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
    }

    const kyc = await KYC.findOne({ user: req.params.userId });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found.' });

    kyc.status = action === 'approve' ? 'approved' : 'rejected';
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    kyc.adminNotes = notes;
    if (action === 'reject') kyc.rejectionReason = reason;
    if (action === 'approve') kyc.approvedAt = new Date();
    await kyc.save();

    // Update user
    const userUpdates = {
      kycStatus: action === 'approve' ? 'approved' : 'rejected',
      ...(action === 'approve' && {
        tradingEnabled: true,
        kycApprovedAt: new Date(),
        segment: ['EQ'],
      }),
      ...(action === 'reject' && { kycRejectionReason: reason }),
    };

    const user = await User.findByIdAndUpdate(req.params.userId, userUpdates, { new: true });

    // Generate Demat account on approval
    if (action === 'approve' && !user.dematAccountNumber) {
      user.generateDematAccount();
      await user.save();
    }

    // Notify user
    await Notification.create({
      user: req.params.userId,
      type: action === 'approve' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      title: action === 'approve' ? 'KYC Approved! 🎉' : 'KYC Rejected',
      message: action === 'approve'
        ? 'Congratulations! Your KYC has been verified. You can now start trading.'
        : `Your KYC was rejected. Reason: ${reason}. Please re-submit.`,
      priority: 'HIGH',
    });

    // Push notification via Socket.IO
    req.app.get('io')?.to(`user:${req.params.userId}`).emit('kyc:status_update', { status: kyc.status });

    logger.info(`Admin ${req.user.email} ${action}d KYC for user ${req.params.userId}`);
    res.json({ success: true, message: `KYC ${action}d successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/wallet/adjust ── Add/deduct balance
router.patch('/wallet/adjust', async (req, res) => {
  try {
    const { userId, amount, type, reason } = req.body;
    if (!['add', 'deduct'].includes(type)) return res.status(400).json({ success: false, message: 'type must be add or deduct.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (type === 'deduct' && user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = type === 'add' ? balanceBefore + amount : balanceBefore - amount;

    // Update BOTH walletBalance AND availableBalance
    await User.findByIdAndUpdate(userId, { 
      walletBalance: balanceAfter,
      availableBalance: balanceAfter  // ✅ Ensure availableBalance matches
    });

    console.log('[Admin Wallet] Updated user balance:', {
      userId,
      balanceBefore,
      balanceAfter,
      type
    });

    const { Transaction } = require('../models/Transaction');
    await Transaction.create({
      user: userId, 
      type: 'ADJUSTMENT',
      direction: type === 'add' ? 'CREDIT' : 'DEBIT',
      amount, 
      balanceBefore, 
      balanceAfter,
      description: `Admin wallet adjustment: ${reason || 'No reason provided'}`,
      paymentMethod: 'INTERNAL',
      processedBy: req.user._id,
      status: 'COMPLETED',
    });

    res.json({ 
      success: true, 
      message: `₹${amount} ${type === 'add' ? 'added to' : 'deducted from'} wallet.`, 
      newBalance: balanceAfter 
    });
  } catch (err) {
    console.error('[Admin Wallet Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/withdrawals ──
router.get('/withdrawals', async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;
    const filter = status !== 'all' ? { status } : {};
    const withdrawals = await Withdrawal.find(filter)
      .populate('user', 'fullName email mobile clientId')
      .sort({ requestedAt: -1 }).limit(+limit).skip((+page - 1) * +limit);
    const total = await Withdrawal.countDocuments(filter);
    res.json({ success: true, data: withdrawals, pagination: { total, page: +page, pages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/withdrawals/:id ── Approve/reject withdrawal
router.patch('/withdrawals/:id', async (req, res) => {
  try {
    const { action, utrNumber, rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found.' });

    withdrawal.status = action === 'approve' ? 'COMPLETED' : 'REJECTED';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user._id;
    if (utrNumber) withdrawal.utrNumber = utrNumber;
    if (rejectionReason) withdrawal.rejectionReason = rejectionReason;
    await withdrawal.save();

    // Handle balance
    if (action === 'reject') {
      // Refund blocked amount
      await User.findByIdAndUpdate(withdrawal.user._id, {
        $inc: { walletBalance: withdrawal.amount, blockedAmount: -withdrawal.amount }
      });
    } else {
      await User.findByIdAndUpdate(withdrawal.user._id, { $inc: { blockedAmount: -withdrawal.amount } });
    }

    await Notification.create({
      user: withdrawal.user._id,
      type: action === 'approve' ? 'WITHDRAWAL_SUCCESS' : 'WITHDRAWAL_REJECTED',
      title: action === 'approve' ? 'Withdrawal Processed' : 'Withdrawal Rejected',
      message: action === 'approve'
        ? `₹${withdrawal.amount.toLocaleString('en-IN')} has been transferred. UTR: ${utrNumber}`
        : `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} was rejected. Reason: ${rejectionReason}`,
      priority: 'HIGH',
    });

    req.app.get('io')?.to(`user:${withdrawal.user._id}`).emit('withdrawal:update', { status: withdrawal.status });
    res.json({ success: true, message: `Withdrawal ${action}d.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/stocks/:symbol/price ── Override stock price
router.patch('/stocks/:symbol/price', async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || price <= 0) return res.status(400).json({ success: false, message: 'Valid price required.' });

    const stock = await Stock.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      { currentPrice: price, adminOverridePrice: price },
      { new: true }
    );
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });

    // Broadcast to all connected clients
    req.app.get('io')?.to('stocks:live').emit('price:update', [{
      symbol: stock.symbol, currentPrice: price
    }]);

    logger.info(`Admin ${req.user.email} set ${stock.symbol} price to ₹${price}`);
    res.json({ success: true, message: `${stock.symbol} price updated to ₹${price}`, data: stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/transactions ──
router.get('/transactions', async (req, res) => {
  try {
    const { type, page = 1, limit = 30 } = req.query;
    const filter = type ? { type } : {};
    const txns = await Transaction.find(filter)
      .populate('user', 'fullName email clientId')
      .sort({ createdAt: -1 }).limit(+limit).skip((+page - 1) * +limit);
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, data: txns, pagination: { total, page: +page, pages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/notifications/broadcast ── Send to all users
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, type = 'SYSTEM', priority = 'MEDIUM' } = req.body;
    const users = await User.find({ role: 'user', isActive: true }).select('_id');

    const notifications = users.map(u => ({ user: u._id, type, title, message, priority }));
    await Notification.insertMany(notifications, { ordered: false });

    req.app.get('io')?.emit('notification:broadcast', { title, message });
    res.json({ success: true, message: `Notification sent to ${users.length} users.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ───────────────────────────────────────────────
// ── FUND REQUEST MANAGEMENT ───────────────────
// ───────────────────────────────────────────────

// GET /api/admin/fund-requests - All DEPOSIT requests
router.get('/fund-requests', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build filter - only DEPOSIT type
    let filter = { type: 'DEPOSIT' };
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }
    
    console.log('[Admin Fund Requests] Query:', { filter });
    
    const data = await FundRequest.find(filter)
      .populate('user', 'fullName email mobile clientId')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await FundRequest.countDocuments(filter);
    
    console.log('[Admin Fund Requests] Found:', data.length, 'deposit requests');
    
    res.json({ 
      success: true, 
      data,
      pagination: { total, page: +page, pages: Math.ceil(total / +limit) } 
    });
  } catch (err) {
    console.error('[Admin Fund Requests Error]:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching fund requests',
      error: err.message 
    });
  }
});

// PUT /api/admin/fund-request/:id/approve
router.put('/fund-request/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const request = await FundRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    if (request.type !== 'DEPOSIT') {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }
    
    console.log('[Admin Fund Approve] Processing:', {
      requestId: request._id,
      userId: request.user,
      amount: request.amount,
      type: request.type
    });
    
    // Update request
    request.status = 'APPROVED';
    request.approvedBy = req.user._id;
    request.approvedAt = Date.now();
    request.adminNotes = req.body.adminNotes || '';
    await request.save();
    
    // Credit wallet - update BOTH fields
    await User.findByIdAndUpdate(request.user, {
      $inc: { 
        walletBalance: request.amount,
        availableBalance: request.amount
      }
    });
    
    console.log('[Admin Fund Approve] Wallet credited ₹', request.amount);
    
    // Create transaction
    await Transaction.create({
      user: request.user,
      type: 'DEPOSIT',
      direction: 'CREDIT',
      amount: request.amount,
      description: `Fund request approved (${request.paymentMethod})`,
      paymentMethod: request.paymentMethod,
      status: 'COMPLETED'
    });
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'FUND_APPROVED',
      title: 'Fund Request Approved',
      message: `₹${request.amount.toLocaleString('en-IN')} has been credited to your wallet.`,
      data: { amount: request.amount, requestId: request._id }
    });
    
    console.log('[Admin Fund Approve] Notification sent to user');
    
    res.json({ success: true, message: 'Fund request approved successfully' });
  } catch (err) {
    console.error('[Admin Fund Approve Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/fund-request/:id/reject
router.put('/fund-request/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const request = await FundRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    if (request.type !== 'DEPOSIT') {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }
    
    console.log('[Admin Fund Reject] Processing rejection:', {
      requestId: request._id,
      amount: request.amount
    });
    
    // Update request
    request.status = 'REJECTED';
    request.approvedBy = req.user._id;
    request.approvedAt = Date.now();
    request.adminNotes = req.body.adminNotes || req.body.reason || '';
    await request.save();
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'FUND_REJECTED',
      title: 'Fund Request Rejected',
      message: `Your fund request of ₹${request.amount.toLocaleString('en-IN')} has been rejected. Reason: ${request.adminNotes}`,
      data: { amount: request.amount, requestId: request._id }
    });
    
    console.log('[Admin Fund Reject] Notification sent to user');
    
    res.json({ success: true, message: 'Fund request rejected' });
  } catch (err) {
    console.error('[Admin Fund Reject Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ───────────────────────────────────────────────
// ── WITHDRAW REQUEST MANAGEMENT ───────────────
// ───────────────────────────────────────────────

// GET /api/admin/withdraw-requests - All WITHDRAW requests
router.get('/withdraw-requests', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build filter - only WITHDRAW type
    let filter = { type: 'WITHDRAW' };
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }
    
    console.log('[Admin Withdraw Requests] Query:', { filter });
    
    const data = await FundRequest.find(filter)
      .populate('user', 'fullName email mobile clientId')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await FundRequest.countDocuments(filter);
    
    console.log('[Admin Withdraw Requests] Found:', data.length, 'withdraw requests');
    
    res.json({ 
      success: true, 
      data,
      pagination: { total, page: +page, pages: Math.ceil(total / +limit) } 
    });
  } catch (err) {
    console.error('[Admin Withdraw Requests Error]:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching withdraw requests',
      error: err.message 
    });
  }
});

// PUT /api/admin/withdraw-request/:id/approve
router.put('/withdraw-request/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const request = await FundRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    if (request.type !== 'WITHDRAW') {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }
    
    console.log('[Admin Withdraw Approve] Processing:', {
      requestId: request._id,
      userId: request.user,
      amount: request.amount,
      type: request.type
    });
    
    // Update request
    request.status = 'APPROVED';
    request.approvedBy = req.user._id;
    request.approvedAt = Date.now();
    request.adminNotes = req.body.adminNotes || '';
    await request.save();
    
    // Deduct from wallet (amount was already blocked when request created)
    await User.findByIdAndUpdate(request.user, {
      $inc: { 
        walletBalance: -request.amount,
        availableBalance: -request.amount
      }
    });
    
    console.log('[Admin Withdraw Approve] Wallet debited ₹', request.amount);
    
    // Create transaction
    await Transaction.create({
      user: request.user,
      type: 'WITHDRAWAL',
      direction: 'DEBIT',
      amount: request.amount,
      description: `Withdrawal approved (${request.paymentMethod})`,
      paymentMethod: request.paymentMethod,
      status: 'COMPLETED'
    });
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'WITHDRAW_APPROVED',
      title: 'Withdrawal Request Approved',
      message: `₹${request.amount.toLocaleString('en-IN')} withdrawal has been approved. Amount will be transferred soon.`,
      data: { amount: request.amount, requestId: request._id }
    });
    
    console.log('[Admin Withdraw Approve] Notification sent to user');
    
    res.json({ success: true, message: 'Withdrawal request approved successfully' });
  } catch (err) {
    console.error('[Admin Withdraw Approve Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/withdraw-request/:id/reject
router.put('/withdraw-request/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const request = await FundRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    if (request.type !== 'WITHDRAW') {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }
    
    console.log('[Admin Withdraw Reject] Processing rejection:', {
      requestId: request._id,
      amount: request.amount
    });
    
    // Refund to wallet
    await User.findByIdAndUpdate(request.user, {
      $inc: { 
        walletBalance: request.amount,
        availableBalance: request.amount
      }
    });
    
    console.log('[Admin Withdraw Reject] Amount ₹', request.amount, 'refunded to wallet');
    
    // Update request
    request.status = 'REJECTED';
    request.approvedBy = req.user._id;
    request.approvedAt = Date.now();
    request.adminNotes = req.body.adminNotes || req.body.reason || '';
    await request.save();
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'WITHDRAW_REJECTED',
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal request of ₹${request.amount.toLocaleString('en-IN')} has been rejected. Reason: ${request.adminNotes}. Amount has been credited back to your wallet.`,
      data: { amount: request.amount, requestId: request._id }
    });
    
    console.log('[Admin Withdraw Reject] Notification sent to user');
    
    res.json({ success: true, message: 'Withdrawal request rejected. Amount refunded.' });
  } catch (err) {
    console.error('[Admin Withdraw Reject Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ───────────────────────────────────────────────
// ── TRADE MONITORING ──────────────────────────
// ───────────────────────────────────────────────

// GET /api/admin/trades - Monitor all user trades
router.get('/trades', async (req, res) => {
  try {
    const { page = 1, limit = 50, symbol, status } = req.query;
    const filter = {};
    if (symbol) filter.symbol = symbol;
    if (status) filter.status = status;
    
    const orders = await Order.find(filter)
      .populate('user', 'fullName email clientId')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: orders, 
      pagination: { total, page: +page, pages: Math.ceil(total / +limit) } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ───────────────────────────────────────────────
// ── POSITIONS MONITORING ──────────────────────
// ───────────────────────────────────────────────

// GET /api/admin/positions - All user positions
router.get('/positions', async (req, res) => {
  try {
    const { isClosed, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (isClosed !== undefined) filter.isClosed = isClosed === 'true';
    
    const positions = await Position.find(filter)
      .populate('user', 'fullName email clientId')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await Position.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: positions, 
      pagination: { total, page: +page, pages: Math.ceil(total / +limit) } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
