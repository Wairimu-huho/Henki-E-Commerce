// middleware/uploadMiddleware.js
require('dotenv').config(); // Direct import of dotenv
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|webp/;
  // Check the extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only! (jpeg, jpg, png, webp)'));
  }
};

// Initialize profile upload with 5MB limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB max file size
  fileFilter: fileFilter
});

// Initialize product upload with 10MB limit
const productImageUpload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB max file size for products
  fileFilter: fileFilter
});

module.exports = { upload, productImageUpload };