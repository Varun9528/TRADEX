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

module.exports = mongoose.model('Watchlist', watchlistSchema);
