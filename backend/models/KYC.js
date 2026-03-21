const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  uploadedAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
});

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // ── STEP 1: PERSONAL ──
  personalDetails: {
    fullName: String, dateOfBirth: Date, gender: String,
    fatherName: String, motherName: String, maritalStatus: String,
    address: {
      line1: String, line2: String, city: String,
      state: String, pincode: String, country: { type: String, default: 'India' }
    },
    annualIncome: String, occupation: String, tradingExperience: String,
  },

  // ── STEP 2: PAN ──
  pan: {
    number: { type: String, uppercase: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
    document: documentSchema,
    verified: { type: Boolean, default: false },
  },

  // ── STEP 3: AADHAAR ──
  aadhaar: {
    number: { type: String, match: /^\d{12}$/ },
    frontDocument: documentSchema,
    backDocument: documentSchema,
    verified: { type: Boolean, default: false },
  },

  // ── STEP 4: BANK ──
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: { type: String, uppercase: true },
    accountType: { type: String, enum: ['savings', 'current'] },
    branchName: String,
    cancelledCheque: documentSchema,
    verified: { type: Boolean, default: false },
  },

  // ── STEP 5: SELFIE ──
  selfie: documentSchema,

  // ── SIGNATURE (Optional) ──
  signature: documentSchema,

  // ── STATUS ──
  status: {
    type: String,
    enum: ['not_started', 'step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'not_started'
  },
  currentStep: { type: Number, default: 0, min: 0, max: 5 },

  // ── REVIEW ──
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  adminNotes: String,
  submittedAt: Date,
  approvedAt: Date,

  // ── IP & DEVICE ──
  submissionIp: String,
  deviceInfo: String,

}, { timestamps: true });

kycSchema.index({ user: 1 });
kycSchema.index({ status: 1 });
kycSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('KYC', kycSchema);
