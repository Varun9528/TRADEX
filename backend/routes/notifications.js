const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/notifications - Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, unreadOnly = false } = req.query;
    
    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: +page,
        pages: Math.ceil(total / +limit)
      }
    });
  } catch (err) {
    console.error('[Get Notifications Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (err) {
    console.error('[Unread Count Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user._id 
      },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (err) {
    console.error('[Mark Read Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        user: req.user._id, 
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('[Mark All Read Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('[Delete Notification Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/clear - Clear all notifications for user
router.delete('/clear', async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    
    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (err) {
    console.error('[Clear All Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
