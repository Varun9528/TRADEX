const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  type: {
    type: String,
    enum: [
      'FUND_REQUEST',
      'FUND_APPROVED',
      'FUND_REJECTED',
      'WITHDRAW_REQUEST',
      'WITHDRAW_APPROVED',
      'WITHDRAW_REJECTED',
      'WITHDRAW_REQUEST_SUBMITTED',
      'TRADE_EXECUTED',
      'TRADING_ENABLED',
      'TRADING_DISABLED',
      'KYC_STATUS',
      'ORDER_STATUS',
      'ORDER_PLACED',
      'ORDER_EXECUTED',
      'ORDER_CANCELLED',
      'FUND_ADDED',
      'FUND_WITHDRAW',
      'FUND_REQUEST_SUBMITTED',
      'TRADE_BY_ADMIN',
      'SYSTEM',
      'GENERAL'
    ],
    required: true
  },
  
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  // Optional reference to related entity
  entityType: {
    type: String,
    enum: ['FUND_REQUEST', 'WITHDRAW_REQUEST', 'ORDER', 'TRADE', 'KYC', 'USER']
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Action URL (optional)
  actionUrl: String,
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,
  
}, { timestamps: true });

// Indexes for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ entityType: 1, entityId: 1 });

// Pre-save hook to set readAt when marked as read
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead === true && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
