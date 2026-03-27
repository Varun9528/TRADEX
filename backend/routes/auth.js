const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const KYC = require('../models/KYC');
const Notification = require('../models/Notification');
const { protect, generateTokens } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

// Helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// ── POST /api/auth/register ──
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('referralCode').optional().trim(),
], validate, async (req, res) => {
  try {
    const { fullName, email, mobile, password, referralCode } = req.body;

    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Mobile';
      return res.status(409).json({ success: false, message: `${field} already registered.` });
    }

    // Handle referral
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
    }

    const user = await User.create({
      fullName, email, mobile, password,
      referredBy: referredByUser?._id,
    });

    // Create KYC record
    await KYC.create({ user: user._id });

    // Update referral count
    if (referredByUser) {
      await User.findByIdAndUpdate(referredByUser._id, { $inc: { referralCount: 1 } });
    }

    // Welcome notification
    await Notification.create({
      user: user._id,
      type: 'SYSTEM',
      title: 'Welcome to TradeX India! 🎉',
      message: 'Your account has been created. Complete KYC to start trading.',
      priority: 'HIGH',
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Welcome to TradeX India',
      template: 'welcome',
      data: { name: fullName, clientId: user.clientId }
    }).catch(err => logger.error('Welcome email error:', err));

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, accessToken, refreshToken }
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isLocked) {
      return res.status(423).json({ success: false, message: 'Account locked. Try again after 2 hours.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Reset login attempts on success
    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 }
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const userData = await User.findById(user._id);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: userData, accessToken, refreshToken }
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ── POST /api/auth/refresh ──
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token.' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ──
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// ── POST /api/auth/send-otp ──
router.post('/send-otp', [body('mobile').matches(/^[6-9]\d{9}$/)], validate, async (req, res) => {
  try {
    const { mobile } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await User.findOneAndUpdate({ mobile }, { otp, otpExpiry }, { upsert: false });
    // In production: integrate Twilio/MSG91 SMS service here
    logger.info(`OTP for ${mobile}: ${otp}`); // dev only
    res.json({ success: true, message: 'OTP sent successfully.', ...(process.env.NODE_ENV === 'development' && { otp }) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

module.exports = router;
