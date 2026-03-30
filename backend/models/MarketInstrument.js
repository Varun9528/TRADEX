const mongoose = require('mongoose');

const marketInstrumentSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  // Instrument Type
  type: {
    type: String,
    enum: ['STOCK', 'FOREX', 'CRYPTO', 'COMMODITY', 'INDEX'],
    required: true,
    default: 'STOCK'
  },
  
  // Exchange
  exchange: {
    type: String,
    enum: ['NSE', 'BSE', 'FOREX', 'CRYPTO', 'MCX'],
    required: true,
    default: 'NSE'
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    default: 0
  },
  open: {
    type: Number,
    default: 0
  },
  high: {
    type: Number,
    default: 0
  },
  low: {
    type: Number,
    default: 0
  },
  close: {
    type: Number,
    default: 0
  },
  
  // Change Calculation
  changePercent: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  
  // Volume
  volume: {
    type: Number,
    default: 0
  },
  
  // Trend Direction
  trend: {
    type: String,
    enum: ['UP', 'DOWN', 'FLAT'],
    default: 'FLAT'
  },
  
  // Chart Data (candles for simulation)
  chartData: [{
    timestamp: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Admin Control
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  description: String,
  sector: String,
  industry: String,
}, {
  timestamps: true
});

// Indexes for performance
marketInstrumentSchema.index({ symbol: 1, exchange: 1 });
marketInstrumentSchema.index({ type: 1, isActive: 1 });
marketInstrumentSchema.index({ trend: 1 });

// Static method to calculate change percent
marketInstrumentSchema.statics.calculateChangePercent = function(open, current) {
  if (!open || open === 0) return 0;
  return ((current - open) / open) * 100;
};

// Pre-save hook to update change percent and trend
marketInstrumentSchema.pre('save', function(next) {
  if (this.open && this.open > 0) {
    this.change = this.price - this.open;
    this.changePercent = ((this.price - this.open) / this.open) * 100;
    
    // Set trend
    if (this.change > 0) {
      this.trend = 'UP';
    } else if (this.change < 0) {
      this.trend = 'DOWN';
    } else {
      this.trend = 'FLAT';
    }
  }
  next();
});

module.exports = mongoose.model('MarketInstrument', marketInstrumentSchema);
