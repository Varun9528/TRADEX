const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Transaction, Withdrawal } = require('../models/Transaction');
const { Notification } = require('../models/Watchlist');
const FundRequest = require('../models/FundRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

// GET /api/wallet/balance - Wallet balance with margin info
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance availableBalance usedMargin openingBalance blockedAmount');
    
    const totalInvestment = user.usedMargin;
    const totalBalance = user.walletBalance + totalInvestment;
    
    res.json({ 
      success: true, 
      data: { 
        availableBalance: user.availableBalance || user.walletBalance,
        walletBalance: user.walletBalance,
        usedMargin: user.usedMargin,
        openingBalance: user.openingBalance,
        blockedAmount: user.blockedAmount,
        totalBalance,
        totalInvestment,
        buyingPower: user.availableBalance || user.walletBalance
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/add-funds - Admin adds funds to user wallet
router.post('/add-funds', protect, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user ID or amount' });
    }
    
    // Check if admin
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin only.' });
    }
    
    // Update user wallet
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.walletBalance += amount;
    user.availableBalance += amount;
    await user.save();
    
    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'CREDIT',
      amount,
      description: `Funds added by admin. New Balance: ₹${user.walletBalance.toLocaleString('en-IN')}`,
      category: 'DEPOSIT'
    });
    await transaction.save();
    
    // Create notification
    await Notification.create({
      user: user._id,
      type: 'FUNDS_ADDED',
      title: 'Funds Added to Wallet',
      message: `₹${amount.toLocaleString('en-IN')} has been added to your wallet by admin.`,
      data: { amount, newBalance: user.walletBalance }
    });
    
    res.json({
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} added successfully`,
      data: {
        walletBalance: user.walletBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[Add Funds Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(+limit).skip((+page - 1) * +limit);
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, data: transactions, pagination: { total, page: +page, pages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/fund-request - Submit fund addition request
router.post('/fund-request', [
  body('amount').isFloat({ min: 100, max: 500000 }).withMessage('Amount must be between ₹100 and ₹5,00,000'),
  body('paymentMethod').isIn(['UPI', 'Bank Transfer', 'QR Payment', 'Net Banking', 'Card']),
  body('transactionReference').optional(),
  body('upiId').optional(),
  body('accountHolderName').optional(),
  body('bankName').optional(),
  body('accountNumber').optional(),
  body('ifscCode').optional(),
  body('cardNumber').optional(),
  body('screenshot').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    let { 
      amount, 
      paymentMethod, 
      transactionReference, 
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      cardNumber,
      screenshot 
    } = req.body;
    
    // Auto-generate transaction reference if not provided
    if (!transactionReference) {
      transactionReference = `TXN${Date.now()}`;
    }
    
    // Create fund request with detailed payment info
    const fundRequest = await FundRequest.create({
      user: req.user._id,
      amount,
      paymentMethod,
      transactionReference,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      cardNumber: cardNumber ? `XXXX-XXXX-${cardNumber.slice(-4)}` : null,
      screenshot: screenshot || null,
      status: 'pending'
    });

    // Create notification for user
    await Notification.create({
      user: req.user._id, 
      type: 'FUND_REQUEST_SUBMITTED',
      title: 'Fund Request Submitted',
      message: `Your request to add ₹${amount.toLocaleString('en-IN')} has been submitted for approval.`,
      data: { amount, requestId: fundRequest._id },
    });

    res.json({ 
      success: true, 
      message: 'Fund request submitted successfully. Admin will approve it soon.', 
      data: fundRequest 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/fund-requests - Get user's fund requests
router.get('/fund-requests', async (req, res) => {
  try {
    const requests = await FundRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'fullName email');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/withdraw-request - Submit withdrawal request
router.post('/withdraw-request', [
  body('amount').isFloat({ min: 100 }),
  body('paymentMethod').isIn(['UPI', 'Bank Transfer']),
  body('bankName').optional(),
  body('accountNumber').optional(),
  body('ifscCode').optional(),
  body('upiId').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { amount, paymentMethod, bankName, accountNumber, ifscCode, upiId } = req.body;
    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: ₹${user.walletBalance.toLocaleString('en-IN')}` 
      });
    }

    // Block the amount temporarily
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: -amount, blockedAmount: amount }
    });

    // Create withdraw request
    const withdrawRequest = await WithdrawRequest.create({
      user: req.user._id,
      amount,
      paymentMethod,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      status: 'pending'
    });

    // Create notification
    await Notification.create({
      user: req.user._id, 
      type: 'WITHDRAW_REQUEST_SUBMITTED',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request of ₹${amount.toLocaleString('en-IN')} has been submitted.`,
      data: { amount, requestId: withdrawRequest._id },
    });

    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully. Admin will process it soon.', 
      data: withdrawRequest 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/withdraw-requests - Get user's withdrawal requests
router.get('/withdraw-requests', async (req, res) => {
  try {
    const requests = await WithdrawRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'fullName email');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────

// POST /api/wallet/approve-fund-request/:id - Admin approves fund request
router.post('/approve-fund-request/:id', protect, async (req, res) => {
  try {
    // Check if admin
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin only.' });
    }

    const fundRequest = await FundRequest.findById(req.params.id).populate('user');
    if (!fundRequest) {
      return res.status(404).json({ success: false, message: 'Fund request not found' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Update user wallet
    const user = await User.findById(fundRequest.user._id);
    user.walletBalance += fundRequest.amount;
    user.availableBalance += fundRequest.amount;
    await user.save();

    // Update fund request status
    fundRequest.status = 'approved';
    fundRequest.approvedBy = req.user._id;
    await fundRequest.save();

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'CREDIT',
      amount: fundRequest.amount,
      description: `Funds added via ${fundRequest.paymentMethod}. Reference: ${fundRequest.transactionReference || 'N/A'}`,
      category: 'DEPOSIT',
      paymentMethod: fundRequest.paymentMethod,
      referenceId: fundRequest.transactionReference || fundRequest._id
    });
    await transaction.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'FUNDS_ADDED',
      title: 'Funds Added to Wallet',
      message: `₹${fundRequest.amount.toLocaleString('en-IN')} has been added to your wallet. Transaction approved by admin.`,
      data: { amount: fundRequest.amount, newBalance: user.walletBalance, requestId: fundRequest._id }
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

// POST /api/wallet/reject-fund-request/:id - Admin rejects fund request
router.post('/reject-fund-request/:id', protect, async (req, res) => {
  try {
    // Check if admin
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin only.' });
    }

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
    await fundRequest.save();

    // Create notification
    await Notification.create({
      user: fundRequest.user._id,
      type: 'FUND_REQUEST_REJECTED',
      title: 'Fund Request Rejected',
      message: `Your fund request of ₹${fundRequest.amount.toLocaleString('en-IN')} has been rejected. Reason: ${fundRequest.rejectionReason}`,
      data: { amount: fundRequest.amount, requestId: fundRequest._id, reason: fundRequest.rejectionReason }
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

// POST /api/wallet/approve-withdraw-request/:id - Admin approves withdrawal
router.post('/approve-withdraw-request/:id', protect, async (req, res) => {
  try {
    // Check if admin
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin only.' });
    }

    const withdrawRequest = await WithdrawRequest.findById(req.params.id).populate('user');
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Check if user has sufficient balance (including blocked amount)
    const user = await User.findById(withdrawRequest.user._id);
    const totalBalance = user.walletBalance + user.blockedAmount;
    
    if (totalBalance < withdrawRequest.amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance in user account' 
      });
    }

    // Deduct from wallet/blocked amount
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

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'DEBIT',
      amount: withdrawRequest.amount,
      description: `Withdrawal approved via ${withdrawRequest.paymentMethod}. ${withdrawRequest.paymentMethod === 'UPI' ? `UPI: ${withdrawRequest.upiId}` : `Bank: ${withdrawRequest.bankName} A/C ${withdrawRequest.accountNumber}`}`,
      category: 'WITHDRAWAL',
      paymentMethod: withdrawRequest.paymentMethod,
      referenceId: withdrawRequest._id
    });
    await transaction.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'WITHDRAW_APPROVED',
      title: 'Withdrawal Approved',
      message: `₹${withdrawRequest.amount.toLocaleString('en-IN')} has been sent to your ${withdrawRequest.paymentMethod === 'UPI' ? `UPI (${withdrawRequest.upiId})` : `bank account (${withdrawRequest.bankName})`}. Amount will be credited within 24 hours.`,
      data: { 
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

// POST /api/wallet/reject-withdraw-request/:id - Admin rejects withdrawal
router.post('/reject-withdraw-request/:id', protect, async (req, res) => {
  try {
    // Check if admin
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin only.' });
    }

    const withdrawRequest = await WithdrawRequest.findById(req.params.id).populate('user');
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Unblock the amount
    await User.findByIdAndUpdate(withdrawRequest.user._id, {
      $inc: { blockedAmount: -withdrawRequest.amount, walletBalance: withdrawRequest.amount }
    });

    // Update withdraw request status
    withdrawRequest.status = 'rejected';
    withdrawRequest.approvedBy = req.user._id;
    withdrawRequest.rejectionReason = req.body.reason || 'Rejected by admin';
    withdrawRequest.processedAt = new Date();
    await withdrawRequest.save();

    // Create notification
    await Notification.create({
      user: withdrawRequest.user._id,
      type: 'WITHDRAW_REJECTED',
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal request of ₹${withdrawRequest.amount.toLocaleString('en-IN')} has been rejected. Reason: ${withdrawRequest.rejectionReason}. Amount unblocked in wallet.`,
      data: { 
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
