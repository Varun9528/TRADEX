const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

module.exports = router;
