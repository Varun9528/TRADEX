const mongoose = require('mongoose');

// ── WATCHLIST MODEL ──
const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stocks: [{
    symbol: { type: String, uppercase: true, required: true },
    stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
    addedAt: { type: Date, default: Date.now },
    alertPrice: Number,
    notes: String,
  }],
}, { timestamps: true });

watchlistSchema.index({ user: 1 });

// ── NOTIFICATION MODEL ──
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['KYC_APPROVED', 'KYC_REJECTED', 'ORDER_PLACED', 'ORDER_EXECUTED', 'ORDER_CANCELLED',
           'DEPOSIT_SUCCESS', 'WITHDRAWAL_SUCCESS', 'WITHDRAWAL_REJECTED', 'PRICE_ALERT',
           'REFERRAL_BONUS', 'SYSTEM', 'DIVIDEND'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  channel: [{ type: String, enum: ['IN_APP', 'EMAIL', 'SMS'] }],
  emailSent: { type: Boolean, default: false },
  smsSent: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = {
  Watchlist: mongoose.model('Watchlist', watchlistSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
