const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  stock: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stock', 
    required: true 
  },
  
  symbol: { 
    type: String, 
    required: true, 
    uppercase: true 
  },
  
  // Position Details
  productType: {
    type: String,
    enum: ['MIS', 'CNC', 'MTF'],
    required: true
  },
  
  transactionType: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  remainingQuantity: {
    type: Number,
    default: 0
  },
  
  // Track buy and sell quantities separately
  buyQuantity: {
    type: Number,
    default: 0
  },
  
  sellQuantity: {
    type: Number,
    default: 0
  },
  
  netQuantity: {
    type: Number,
    default: 0
  },
  
  // Pricing
  averagePrice: { 
    type: Number, 
    required: true 
  },
  
  currentPrice: { 
    type: Number, 
    default: 0 
  },
  
  investmentValue: { 
    type: Number, 
    required: true 
  },
  
  currentValue: { 
    type: Number, 
    default: 0 
  },
  
  // P&L
  unrealizedPnl: { 
    type: Number, 
    default: 0 
  },
  
  realizedPnl: { 
    type: Number, 
    default: 0 
  },
  
  totalPnl: { 
    type: Number, 
    default: 0 
  },
  
  pnlPercentage: { 
    type: Number, 
    default: 0 
  },
  
  // Leverage
  leverageUsed: {
    type: Number,
    default: 1
  },
  
  // Status
  isClosed: {
    type: Boolean,
    default: false
  },
  
  closedAt: Date,
  
}, { timestamps: true });

// Indexes
positionSchema.index({ user: 1, isClosed: 1 });
positionSchema.index({ user: 1, symbol: 1 });
positionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Position', positionSchema);
