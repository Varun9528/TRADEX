const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Request Details
  amount: { 
    type: Number, 
    required: true, 
    min: 100 
  },
  
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Bank Transfer'],
    required: true
  },
  
  // Bank Details
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  upiId: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  adminNotes: {
    type: String,
    default: ''
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
}, { timestamps: true });

// Indexes
withdrawRequestSchema.index({ user: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1 });
withdrawRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
