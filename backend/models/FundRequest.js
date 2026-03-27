const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema({
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
    enum: ['UPI', 'Bank Transfer', 'QR Payment'],
    required: true
  },
  
  // Payment Details
  upiId: {
    type: String,
    trim: true
  },
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  
  transactionReference: {
    type: String,
    required: true,
    trim: true,
    default: () => `TXN${Date.now()}`
  },
  
  screenshot: {
    type: String, // URL to uploaded image
    default: null
  },
  
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

// Indexes for efficient querying
fundRequestSchema.index({ user: 1, createdAt: -1 });
fundRequestSchema.index({ status: 1 });
fundRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FundRequest', fundRequestSchema);
