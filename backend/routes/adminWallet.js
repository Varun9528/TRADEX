const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FundRequest = require('../models/FundRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

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

// Apply protect and isAdmin middleware to all routes
router.use(protect);
router.use(isAdmin);

// ==================== FUND REQUESTS ====================

// GET /api/admin/fund-requests - Get all fund requests
router.get('/fund-requests', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    const fundRequests = await FundRequest.find(query)
      .populate('user', 'fullName email mobile clientId')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await FundRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: fundRequests,
      pagination: {
        total,
        page: +page,
        pages: Math.ceil(total / +limit)
      }
    });
  } catch (err) {
    console.error('[Admin Fund Requests Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/fund-requests/:id - Get single fund request
router.get('/fund-requests/:id', async (req, res) => {
  try {
    const fundRequest = await FundRequest.findById(req.params.id)
      .populate('user', 'fullName email mobile clientId walletBalance')
      .populate('approvedBy', 'fullName email');
    
    if (!fundRequest) {
      return res.status(404).json({ success: false, message: 'Fund request not found' });
    }
    
    res.json({ success: true, data: fundRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/approve-fund/:id - Approve fund request
router.post('/approve-fund/:id', async (req, res) => {
  try {
    const fundRequest = await FundRequest.findById(req.params.id).populate('user');
    if (!fundRequest) {
      return res.status(404).json({ success: false, message: 'Fund request not found' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Update user wallet
    const user = await User.findById(fundRequest.user._id);
    const previousBalance = user.walletBalance;
    user.walletBalance += fundRequest.amount;
    user.availableBalance += fundRequest.amount;
    await user.save();

    // Update fund request status
    fundRequest.status = 'approved';
    fundRequest.approvedBy = req.user._id;
    fundRequest.approvedAt = new Date();
    await fundRequest.save();

    // Create transaction record
    const Transaction = require('../models/Transaction').Transaction;
    const transaction = await Transaction.create({
      user: user._id,
      type: 'CREDIT',
      direction: 'CREDIT',
      amount: fundRequest.amount,
      balanceBefore: previousBalance,
      balanceAfter: user.walletBalance,
      description: `Funds added via ${fundRequest.paymentMethod}. Reference: ${fundRequest.transactionReference || 'N/A'}`,
      reference: fundRequest.transactionReference || fundRequest._id.toString(),
      paymentMethod: fundRequest.paymentMethod === 'UPI' ? 'UPI' : 'NET_BANKING',
      status: 'COMPLETED',
      metadata: {
        fundRequestId: fundRequest._id,
        approvedBy: req.user._id
      }
    });

    // Create notification for user
    await Notification.create({
      user: user._id,
      type: 'FUND_APPROVED',
      priority: 'HIGH',
      title: 'Funds Added to Wallet',
      message: `₹${fundRequest.amount.toLocaleString('en-IN')} has been credited to your wallet. Transaction approved by admin. New Balance: ₹${user.walletBalance.toLocaleString('en-IN')}`,
      entityType: 'FUND_REQUEST',
      entityId: fundRequest._id,
      metadata: {
        amount: fundRequest.amount,
        newBalance: user.walletBalance,
        requestId: fundRequest._id
      }
    });

    res.json({
      success: true,
      message: `₹${fundRequest.amount.toLocaleString('en-IN')} approved and added successfully`,
      data: {
        walletBalance: user.walletBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[Approve Fund Request Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reject-fund/:id - Reject fund request
router.post('/reject-fund/:id', async (req, res) => {
  try {
    const fundRequest = await FundRequest.findById(req.params.id).populate('user');
    if (!fundRequest) {
      return res.status(404).json({ success: false, message: 'Fund request not found' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Update fund request status
    fundRequest.status = 'rejected';
    fundRequest.approvedBy = req.user._id;
    fundRequest.rejectionReason = req.body.reason || 'Rejected by admin';
    fundRequest.approvedAt = new Date();
    await fundRequest.save();

    // Create notification for user
    await Notification.create({
      user: fundRequest.user._id,
      type: 'FUND_REJECTED',
      priority: 'MEDIUM',
      title: 'Fund Request Rejected',
      message: `Your fund request of ₹${fundRequest.amount.toLocaleString('en-IN')} has been rejected. Reason: ${fundRequest.rejectionReason}`,
      entityType: 'FUND_REQUEST',
      entityId: fundRequest._id,
      metadata: {
        amount: fundRequest.amount,
        requestId: fundRequest._id,
        reason: fundRequest.rejectionReason
      }
    });

    res.json({
      success: true,
      message: 'Fund request rejected successfully'
    });
  } catch (err) {
    console.error('[Reject Fund Request Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== WITHDRAW REQUESTS ====================

// GET /api/admin/withdraw-requests - Get all withdrawal requests
router.get('/withdraw-requests', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    const withdrawRequests = await WithdrawRequest.find(query)
      .populate('user', 'fullName email mobile clientId walletBalance')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await WithdrawRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: withdrawRequests,
      pagination: {
        total,
        page: +page,
        pages: Math.ceil(total / +limit)
      }
    });
  } catch (err) {
    console.error('[Admin Withdraw Requests Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/withdraw-requests/:id - Get single withdraw request
router.get('/withdraw-requests/:id', async (req, res) => {
  try {
    const withdrawRequest = await WithdrawRequest.findById(req.params.id)
      .populate('user', 'fullName email mobile clientId walletBalance')
      .populate('approvedBy', 'fullName email');
    
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }
    
    res.json({ success: true, data: withdrawRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/approve-withdraw/:id - Approve withdrawal request
router.post('/approve-withdraw/:id', async (req, res) => {
  try {
    const withdrawRequest = await WithdrawRequest.findById(req.params.id).populate('user');
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Check if user has sufficient balance
    const user = await User.findById(withdrawRequest.user._id);
    const totalBalance = user.walletBalance + user.blockedAmount;
    
    if (totalBalance < withdrawRequest.amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance in user account' 
      });
    }

    const previousBalance = user.walletBalance;
    
    // Deduct from blocked amount first, then from wallet
    const deductionFromBlocked = Math.min(user.blockedAmount, withdrawRequest.amount);
    const deductionFromWallet = withdrawRequest.amount - deductionFromBlocked;

    user.blockedAmount -= deductionFromBlocked;
    user.walletBalance -= deductionFromWallet;
    await user.save();

    // Update withdraw request status
    withdrawRequest.status = 'approved';
    withdrawRequest.approvedBy = req.user._id;
    withdrawRequest.processedAt = new Date();
    await withdrawRequest.save();

    // Create transaction record
    const Transaction = require('../models/Transaction').Transaction;
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEBIT',
      direction: 'DEBIT',
      amount: withdrawRequest.amount,
      balanceBefore: previousBalance,
      balanceAfter: user.walletBalance,
      description: `Withdrawal approved via ${withdrawRequest.paymentMethod}. ${withdrawRequest.paymentMethod === 'UPI' ? `UPI: ${withdrawRequest.upiId}` : `Bank: ${withdrawRequest.bankName} A/C ${withdrawRequest.accountNumber}`}`,
      reference: withdrawRequest._id.toString(),
      paymentMethod: withdrawRequest.paymentMethod === 'UPI' ? 'UPI' : 'NET_BANKING',
      status: 'COMPLETED',
      bankAccount: {
        accountNumber: withdrawRequest.accountNumber,
        ifscCode: withdrawRequest.ifscCode,
        bankName: withdrawRequest.bankName
      },
      metadata: {
        withdrawRequestId: withdrawRequest._id,
        approvedBy: req.user._id
      }
    });

    // Create notification for user
    await Notification.create({
      user: user._id,
      type: 'WITHDRAW_APPROVED',
      priority: 'HIGH',
      title: 'Withdrawal Approved',
      message: `₹${withdrawRequest.amount.toLocaleString('en-IN')} has been sent to your ${withdrawRequest.paymentMethod === 'UPI' ? `UPI (${withdrawRequest.upiId})` : `bank account (${withdrawRequest.bankName})`}. Amount will be credited within 24 hours.`,
      entityType: 'WITHDRAW_REQUEST',
      entityId: withdrawRequest._id,
      metadata: { 
        amount: withdrawRequest.amount, 
        requestId: withdrawRequest._id,
        paymentMethod: withdrawRequest.paymentMethod,
        upiId: withdrawRequest.upiId,
        bankName: withdrawRequest.bankName
      }
    });

    res.json({
      success: true,
      message: `₹${withdrawRequest.amount.toLocaleString('en-IN')} withdrawal approved successfully`
    });
  } catch (err) {
    console.error('[Approve Withdraw Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reject-withdraw/:id - Reject withdrawal request
router.post('/reject-withdraw/:id', async (req, res) => {
  try {
    const withdrawRequest = await WithdrawRequest.findById(req.params.id).populate('user');
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Unblock the amount (return to wallet)
    const user = await User.findById(withdrawRequest.user._id);
    user.blockedAmount -= withdrawRequest.amount;
    user.walletBalance += withdrawRequest.amount;
    await user.save();

    // Update withdraw request status
    withdrawRequest.status = 'rejected';
    withdrawRequest.approvedBy = req.user._id;
    withdrawRequest.rejectionReason = req.body.reason || 'Rejected by admin';
    withdrawRequest.processedAt = new Date();
    await withdrawRequest.save();

    // Create notification for user
    await Notification.create({
      user: withdrawRequest.user._id,
      type: 'WITHDRAW_REJECTED',
      priority: 'MEDIUM',
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal request of ₹${withdrawRequest.amount.toLocaleString('en-IN')} has been rejected. Reason: ${withdrawRequest.rejectionReason}. Amount unblocked and returned to wallet.`,
      entityType: 'WITHDRAW_REQUEST',
      entityId: withdrawRequest._id,
      metadata: { 
        amount: withdrawRequest.amount, 
        requestId: withdrawRequest._id, 
        reason: withdrawRequest.rejectionReason 
      }
    });

    res.json({
      success: true,
      message: 'Withdrawal request rejected successfully. Amount unblocked.'
    });
  } catch (err) {
    console.error('[Reject Withdraw Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
