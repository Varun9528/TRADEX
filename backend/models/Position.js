const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  averagePrice: { type: Number, default: 0 },
  currentPrice: { type: Number, default: 0 },
  leverageUsed: { type: Number, default: 1 },
  productType: { 
    type: String, 
    enum: ['MIS', 'CNC', 'MTF'], 
    default: 'CNC' 
  },
  investmentValue: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  unrealizedPnl: { type: Number, default: 0 },
  realizedPnl: { type: Number, default: 0 },
  totalPnl: { type: Number, default: 0 },
  buyQuantity: { type: Number, default: 0 },
  sellQuantity: { type: Number, default: 0 },
  netQuantity: { type: Number, default: 0 },
  isClosed: { type: Boolean, default: false },
  closedAt: Date,
}, {
  timestamps: true
});

// Indexes for performance
positionSchema.index({ userId: 1, symbol: 1 });
positionSchema.index({ userId: 1, isClosed: 1 });

module.exports = mongoose.model('Position', positionSchema);
