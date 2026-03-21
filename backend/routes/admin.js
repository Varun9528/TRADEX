const express = require('express');
const router = express.Router();
const User = require('../models/User');
const KYC = require('../models/KYC');
const Stock = require('../models/Stock');
const { Order } = require('../models/Order');
const { Transaction, Withdrawal } = require('../models/Transaction');
const { Notification } = require('../models/Watchlist');
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

    await User.findByIdAndUpdate(userId, { walletBalance: balanceAfter });

    const { Transaction } = require('../models/Transaction');
    await Transaction.create({
      user: userId, type: 'ADJUSTMENT',
      direction: type === 'add' ? 'CREDIT' : 'DEBIT',
      amount, balanceBefore, balanceAfter,
      description: `Admin wallet adjustment: ${reason || 'No reason provided'}`,
      paymentMethod: 'INTERNAL',
      processedBy: req.user._id,
      status: 'COMPLETED',
    });

    res.json({ success: true, message: `₹${amount} ${type === 'add' ? 'added to' : 'deducted from'} wallet.`, newBalance: balanceAfter });
  } catch (err) {
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

module.exports = router;
