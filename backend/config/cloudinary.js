const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'kyc');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock storage engine - stores files locally but returns dummy paths
const createMockStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(uploadsDir, folder);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate simple filename
      const uniqueName = `${file.fieldname}_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
};

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'), false);
  }
};

// Create upload middleware with LOCAL storage (no Cloudinary)
const uploadKYC = multer({
  storage: createMockStorage('documents'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadSelfie = multer({
  storage: createMockStorage('selfies'),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// Mock function to simulate Cloudinary upload (always succeeds)
const mockCloudinaryUpload = (file) => {
  return {
    url: `/uploads/kyc/documents/${file.filename}`,
    publicId: file.filename,
    mock: true,
    uploadedAt: new Date()
  };
};

module.exports = { 
  uploadKYC, 
  uploadSelfie,
  mockCloudinaryUpload
};
