const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ── BASIC INFO ──
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },

  // ── PROFILE ──
  dateOfBirth: Date,
  address: {
    line1: String, line2: String,
    city: String, state: String, pincode: String,
  },
  annualIncome: {
    type: String,
    enum: ['0-1L', '1-5L', '5-10L', '10-25L', '25L+'],
    default: '1-5L'
  },
  occupation: String,
  profilePicture: String,

  // ── TRADING ACCOUNT ──
  clientId: { type: String, unique: true, sparse: true },
  dematAccountNumber: { type: String, unique: true, sparse: true },
  tradingEnabled: { type: Boolean, default: false },
  segment: [{ type: String, enum: ['EQ', 'FO', 'MF'] }],

  // ── WALLET & MARGIN ──
  walletBalance: { type: Number, default: 0, min: 0 },
  availableBalance: { type: Number, default: 0, min: 0 },
  usedMargin: { type: Number, default: 0, min: 0 },
  openingBalance: { type: Number, default: 0 },
  blockedAmount: { type: Number, default: 0 },

  // ── KYC ──
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'under_review', 'approved', 'rejected'],
    default: 'not_started'
  },
  kycRejectionReason: String,
  kycSubmittedAt: Date,
  kycApprovedAt: Date,

  // ── REFERRAL ──
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },

  // ── AUTH ──
  refreshToken: { type: String, select: false },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
  emailVerified: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,

}, { timestamps: true });

// ── INDEXES ──
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ clientId: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ createdAt: -1 });

// ── VIRTUAL: is account locked ──
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── PRE-SAVE: hash password & generate IDs ──
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (!this.clientId) {
    this.clientId = 'TRX' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
  }
  if (!this.referralCode) {
    this.referralCode = 'TRX' + this.fullName.replace(/\s/g, '').toUpperCase().slice(0, 4) + Math.floor(Math.random() * 9000 + 1000);
  }
  next();
});

// ── METHODS ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

userSchema.methods.generateDematAccount = function () {
  this.dematAccountNumber = 'IN' + '30' + Math.floor(Math.random() * 1e10).toString().padStart(10, '0');
  return this.dematAccountNumber;
};

// ── TOOBJECT: remove sensitive fields ──
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, obj) => {
    delete obj.password; delete obj.refreshToken;
    delete obj.otp; delete obj.otpExpiry;
    delete obj.passwordResetToken; delete obj.__v;
    return obj;
  }
});

module.exports = mongoose.model('User', userSchema);
