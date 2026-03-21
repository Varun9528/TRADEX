const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Transaction, Withdrawal } = require('../models/Transaction');
const { Notification } = require('../models/Watchlist');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

// GET /api/wallet/balance
router.get('/balance', async (req, res) => {
  const user = await User.findById(req.user._id).select('walletBalance blockedAmount');
  res.json({ success: true, data: { balance: user.walletBalance, blocked: user.blockedAmount, available: user.walletBalance - user.blockedAmount } });
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

// POST /api/wallet/add — Add funds (mock payment)
router.post('/add', [
  body('amount').isFloat({ min: 100, max: 500000 }).withMessage('Amount must be between ₹100 and ₹5,00,000'),
  body('paymentMethod').isIn(['UPI', 'NET_BANKING', 'DEBIT_CARD', 'NEFT', 'RTGS']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { amount, paymentMethod, upiId } = req.body;
    const user = await User.findById(req.user._id);
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + amount;

    // Mock payment processing delay simulation
    // In production: integrate Razorpay/Paytm payment gateway here

    await User.findByIdAndUpdate(user._id, { walletBalance: balanceAfter });

    const txn = await Transaction.create({
      user: user._id, type: 'DEPOSIT', direction: 'CREDIT',
      amount, balanceBefore, balanceAfter,
      description: `Funds added via ${paymentMethod}`,
      paymentMethod,
      gatewayTransactionId: 'MOCK_' + Date.now(),
      status: 'COMPLETED',
    });

    await Notification.create({
      user: user._id, type: 'DEPOSIT_SUCCESS',
      title: 'Funds Added Successfully',
      message: `₹${amount.toLocaleString('en-IN')} has been credited to your wallet via ${paymentMethod}.`,
      data: { amount, txnId: txn._id },
    });

    req.app.get('io')?.to(`user:${user._id}`).emit('wallet:updated', { balance: balanceAfter });

    res.json({ success: true, message: 'Funds added successfully.', data: { transaction: txn, newBalance: balanceAfter } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/withdraw — Request withdrawal
router.post('/withdraw', [
  body('amount').isFloat({ min: 100 }),
  body('bankAccount.accountNumber').notEmpty(),
  body('bankAccount.ifscCode').notEmpty(),
  body('bankAccount.bankName').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { amount, bankAccount } = req.body;
    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${user.walletBalance}` });
    }

    // Block amount
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: -amount, blockedAmount: amount }
    });

    const withdrawal = await Withdrawal.create({ user: user._id, amount, bankAccount });

    await Notification.create({
      user: user._id, type: 'SYSTEM',
      title: 'Withdrawal Request Placed',
      message: `₹${amount.toLocaleString('en-IN')} withdrawal request placed. Processing in 1-2 business days.`,
    });

    res.json({ success: true, message: 'Withdrawal request placed.', data: withdrawal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/withdrawals
router.get('/withdrawals', async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: withdrawals });
});

module.exports = router;
