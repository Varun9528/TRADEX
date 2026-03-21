const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// PUT /api/users/profile
router.put('/profile', [
  body('fullName').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('dateOfBirth').optional().isISO8601(),
  body('annualIncome').optional().isIn(['0-1L', '1-5L', '5-10L', '10-25L', '25L+']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const allowed = ['fullName', 'dateOfBirth', 'address', 'annualIncome', 'occupation'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/change-password
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/referral
router.get('/referral', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralCount referralEarnings');
    const referrals = await User.find({ referredBy: req.user._id }).select('fullName createdAt kycStatus').limit(20);
    res.json({ success: true, data: { referralCode: user.referralCode, count: user.referralCount, earnings: user.referralEarnings, referrals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
