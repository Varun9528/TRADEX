const express = require('express');
const router = express.Router();
const KYC = require('../models/KYC');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { uploadKYC, uploadSelfie, mockCloudinaryUpload } = require('../config/cloudinary');
const logger = require('../utils/logger');

// All routes protected
router.use(protect);

// ── GET /api/kyc/status ── Get current KYC status & data
router.get('/status', async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user._id });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found.' });
    res.json({ success: true, data: { kyc, kycStatus: req.user.kycStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/kyc/personal ── Step 1: Personal details
router.put('/personal', async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, fatherName, motherName, maritalStatus,
            address, annualIncome, occupation, tradingExperience } = req.body;

    const kyc = await KYC.findOneAndUpdate(
      { user: req.user._id },
      {
        personalDetails: { fullName, dateOfBirth, gender, fatherName, motherName,
                           maritalStatus, address, annualIncome, occupation, tradingExperience },
        $max: { currentStep: 1 },
        status: 'step_1',
        submissionIp: req.ip,
      },
      { new: true, upsert: true }
    );

    // Update user profile
    await User.findByIdAndUpdate(req.user._id, { address, annualIncome });

    res.json({ success: true, message: 'Personal details saved.', data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/kyc/pan ── Step 2: PAN card + document upload
router.put('/pan', uploadKYC.single('panDocument'), async (req, res) => {
  try {
    const { panNumber } = req.body;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN number format.' });
    }

    const updateData = {
      'pan.number': panNumber.toUpperCase(),
      $max: { currentStep: 2 },
      status: 'step_2',
    };

    // Use mock upload - always succeeds even without file
    if (req.file) {
      const mockUpload = mockCloudinaryUpload(req.file);
      updateData['pan.document'] = { url: mockUpload.url, publicId: mockUpload.publicId, mock: true };
    } else {
      // Allow proceeding without file for demo purposes
      updateData['pan.document'] = { url: '/uploads/kyc/demo/pan_placeholder.pdf', publicId: 'demo_pan', mock: true };
    }

    const kyc = await KYC.findOneAndUpdate({ user: req.user._id }, updateData, { new: true });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found.' });

    res.json({ success: true, message: 'PAN details saved successfully.', data: kyc });
  } catch (err) {
    logger.error('PAN upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to save PAN details' });
  }
});

// ── PUT /api/kyc/aadhaar ── Step 3: Aadhaar
router.put('/aadhaar', uploadKYC.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Aadhaar must be 12 digits.' });
    }

    const updateData = {
      'aadhaar.number': aadhaarNumber,
      $max: { currentStep: 3 },
      status: 'step_3',
    };

    // Mock upload - always succeeds
    if (req.files?.aadhaarFront?.[0]) {
      const mockUpload = mockCloudinaryUpload(req.files.aadhaarFront[0]);
      updateData['aadhaar.frontDocument'] = { url: mockUpload.url, publicId: mockUpload.publicId, mock: true };
    } else {
      updateData['aadhaar.frontDocument'] = { url: '/uploads/kyc/demo/aadhaar_front.pdf', publicId: 'demo_aadhaar_front', mock: true };
    }
    
    if (req.files?.aadhaarBack?.[0]) {
      const mockUpload = mockCloudinaryUpload(req.files.aadhaarBack[0]);
      updateData['aadhaar.backDocument'] = { url: mockUpload.url, publicId: mockUpload.publicId, mock: true };
    } else {
      updateData['aadhaar.backDocument'] = { url: '/uploads/kyc/demo/aadhaar_back.pdf', publicId: 'demo_aadhaar_back', mock: true };
    }

    const kyc = await KYC.findOneAndUpdate({ user: req.user._id }, updateData, { new: true });
    res.json({ success: true, message: 'Aadhaar details saved successfully.', data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save Aadhaar details' });
  }
});

// ── PUT /api/kyc/bank ── Step 4: Bank details
router.put('/bank', uploadKYC.single('cancelledCheque'), async (req, res) => {
  try {
    const { bankName, accountNumber, ifscCode, accountType, branchName } = req.body;

    const updateData = {
      'bankDetails.bankName': bankName,
      'bankDetails.accountNumber': accountNumber,
      'bankDetails.ifscCode': ifscCode?.toUpperCase(),
      'bankDetails.accountType': accountType,
      'bankDetails.branchName': branchName,
      $max: { currentStep: 4 },
      status: 'step_4',
    };

    // Mock upload - always succeeds
    if (req.file) {
      const mockUpload = mockCloudinaryUpload(req.file);
      updateData['bankDetails.cancelledCheque'] = { url: mockUpload.url, publicId: mockUpload.publicId, mock: true };
    } else {
      updateData['bankDetails.cancelledCheque'] = { url: '/uploads/kyc/demo/cheque.pdf', publicId: 'demo_cheque', mock: true };
    }

    const kyc = await KYC.findOneAndUpdate({ user: req.user._id }, updateData, { new: true });
    res.json({ success: true, message: 'Bank details saved successfully.', data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save bank details' });
  }
});

// ── PUT /api/kyc/selfie ── Step 5: Selfie upload
router.put('/selfie', uploadSelfie.single('selfie'), async (req, res) => {
  try {
    // Mock upload - always succeeds even without file
    const updateData = {
      $max: { currentStep: 5 },
      status: 'step_5',
    };

    if (req.file) {
      const mockUpload = mockCloudinaryUpload(req.file);
      updateData.selfie = { url: mockUpload.url, publicId: mockUpload.publicId, mock: true };
    } else {
      // Allow proceeding without file for demo purposes
      updateData.selfie = { url: '/uploads/kyc/demo/selfie.jpg', publicId: 'demo_selfie', mock: true };
    }

    const kyc = await KYC.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true }
    );

    res.json({ success: true, message: 'Selfie uploaded successfully.', data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload selfie' });
  }
});

// ── POST /api/kyc/submit ── Final submission
router.post('/submit', async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user._id });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found.' });
    if (kyc.currentStep < 5) {
      return res.status(400).json({ success: false, message: `Complete all steps first. Current: step ${kyc.currentStep}` });
    }

    kyc.status = 'submitted';
    kyc.submittedAt = new Date();
    kyc.deviceInfo = req.headers['user-agent'];
    await kyc.save();

    await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending', kycSubmittedAt: new Date() });

    // Notify user
    await Notification.create({
      user: req.user._id,
      type: 'SYSTEM',
      title: 'KYC Submitted Successfully',
      message: 'Your KYC has been submitted. Verification takes 1-2 business days.',
      priority: 'HIGH',
    });

    // Notify admins via Socket.IO
    req.app.get('io')?.to('admin:room').emit('kyc:new_submission', {
      userId: req.user._id,
      userName: req.user.fullName,
      submittedAt: new Date()
    });

    res.json({ success: true, message: 'KYC submitted for review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
