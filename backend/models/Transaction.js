const mongoose = require('mongoose');

// ── TRANSACTION MODEL ──
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAWAL', 'BUY_DEBIT', 'SELL_CREDIT', 'BROKERAGE', 'DIVIDEND', 'REFERRAL_BONUS', 'REFUND', 'ADJUSTMENT'],
    required: true
  },
  direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },

  description: { type: String, required: true },
  reference: String,
  orderId: String,

  // Payment gateway details
  paymentMethod: { type: String, enum: ['UPI', 'NET_BANKING', 'DEBIT_CARD', 'NEFT', 'RTGS', 'INTERNAL'] },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,

  // Status
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'],
    default: 'COMPLETED'
  },
  failureReason: String,

  // Bank details for withdrawals
  bankAccount: {
    accountNumber: String, ifscCode: String, bankName: String
  },

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for admin adjustments
  metadata: mongoose.Schema.Types.Mixed,

}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });

// ── WITHDRAWAL REQUEST MODEL ──
const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 100 },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'],
    default: 'PENDING'
  },
  bankAccount: {
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    accountType: String,
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date,
  rejectionReason: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: String,
  utrNumber: String,
}, { timestamps: true });

withdrawalSchema.index({ user: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ requestedAt: -1 });

module.exports = {
  Transaction: mongoose.model('Transaction', transactionSchema),
  Withdrawal: mongoose.model('Withdrawal', withdrawalSchema),
};
