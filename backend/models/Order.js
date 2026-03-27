const mongoose = require('mongoose');

// ── ORDER MODEL ──
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  symbol: { type: String, required: true, uppercase: true },

  orderType: { type: String, enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_MARKET'], required: true },
  transactionType: { type: String, enum: ['BUY', 'SELL'], required: true },
  productType: { type: String, enum: ['MIS', 'CNC', 'MTF'], default: 'CNC' },

  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number }, // For LIMIT orders
  triggerPrice: { type: Number }, // For STOP_LOSS
  executedPrice: { type: Number },
  executedQuantity: { type: Number, default: 0 },

  totalAmount: Number,        // quantity * executedPrice
  brokerage: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  netAmount: Number,          // totalAmount + brokerage + taxes

  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'PARTIAL', 'COMPLETE', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectionReason: String,

  validityType: { type: String, enum: ['DAY', 'IOC', 'GTC'], default: 'DAY' },
  exchange: { type: String, enum: ['NSE', 'BSE'], default: 'NSE' },

  orderId: { type: String, unique: true },
  parentOrderId: String,

  // Additional fields for better tracking
  side: { type: String, enum: ['BUY', 'SELL'] }, // Alias for transactionType
  leverageUsed: { type: Number, default: 1 },
  requiredMargin: { type: Number, default: 0 },
  orderValue: { type: Number },
  pnl: { type: Number, default: 0 }, // For SELL orders

  placedAt: { type: Date, default: Date.now },
  executedAt: Date,
  cancelledAt: Date,

  tag: String,
  notes: String,

}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ symbol: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderId: 1 });

orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'ORD' + Date.now().toString() + Math.floor(Math.random() * 1000);
  }
  next();
});

// ── HOLDING MODEL ──
const holdingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  symbol: { 
    type: String, 
    required: true, 
    uppercase: true,  // ✅ Auto-uppercase
    trim: true,       // ✅ Auto-trim whitespace
    index: true
  },

  quantity: { type: Number, required: true, min: 0 },
  avgBuyPrice: { type: Number, required: true },
  totalInvested: { type: Number, required: true },

  productType: { type: String, enum: ['DELIVERY', 'MTF'], default: 'DELIVERY' },
  firstBuyDate: Date,
  lastBuyDate: Date,

}, { timestamps: true });

holdingSchema.index({ user: 1 });
holdingSchema.index({ symbol: 1 });
holdingSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = {
  Order: mongoose.model('Order', orderSchema),
  Holding: mongoose.model('Holding', holdingSchema),
};
