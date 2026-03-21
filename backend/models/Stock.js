const mongoose = require('mongoose');

const ohlcSchema = new mongoose.Schema({
  open: Number, high: Number, low: Number, close: Number,
  volume: Number, timestamp: Date,
}, { _id: false });

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  logo: { type: String, default: '📊' },
  exchange: { type: String, enum: ['NSE', 'BSE', 'BOTH'], default: 'BOTH' },
  isin: { type: String, unique: true, sparse: true },
  series: { type: String, default: 'EQ' },

  // ── PRICING ──
  currentPrice: { type: Number, required: true },
  previousClose: { type: Number, required: true },
  openPrice: Number,
  dayHigh: Number,
  dayLow: Number,
  weekHigh52: Number,
  weekLow52: Number,
  volume: { type: Number, default: 0 },
  avgVolume: { type: Number, default: 0 },

  // ── DERIVED ──
  change: { type: Number, default: 0 },        // absolute change
  changePercent: { type: Number, default: 0 }, // % change
  marketCap: Number,

  // ── FUNDAMENTALS ──
  pe: Number, pb: Number, eps: Number,
  dividendYield: Number, faceValue: Number,
  bookValue: Number, debtToEquity: Number,

  // ── META ──
  isActive: { type: Boolean, default: true },
  isIndexStock: { type: Boolean, default: false },
  circuitLimitUp: Number,
  circuitLimitDown: Number,

  // ── OHLC HISTORY (Last 30 days for charts) ──
  priceHistory: [ohlcSchema],

  // ── ADMIN CONTROL ──
  adminOverridePrice: Number,
  volatilityFactor: { type: Number, default: 1.0, min: 0.1, max: 5.0 },

}, { timestamps: true });

stockSchema.index({ symbol: 1 });
stockSchema.index({ sector: 1 });
stockSchema.index({ isActive: 1 });
stockSchema.index({ marketCap: -1 });

// Virtual: formatted price
stockSchema.virtual('formattedPrice').get(function () {
  return `₹${this.currentPrice.toFixed(2)}`;
});

module.exports = mongoose.model('Stock', stockSchema);
