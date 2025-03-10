const express = require('express');
const router = express.Router();
const {
  uploadProductImage,
  uploadAdditionalProductImages,
  deleteProductImage
} = require('../controllers/productImageController');
const { protect, seller } = require('../middleware/authMiddleware');
const { productImageUpload } = require('../middleware/uploadMiddleware');

// Upload main product image
router.post(
  '/:id/upload-image',
  protect,
  seller,
  productImageUpload.single('image'),
  uploadProductImage
);

// Upload additional product images
router.post(
  '/:id/upload-additional-images',
  protect,
  seller,
  productImageUpload.array('images', 5), // Allow up to 5 images at once
  uploadAdditionalProductImages
);

// Delete additional image
router.delete(
  '/:id/delete-image/:imageIndex',
  protect,
  seller,
  deleteProductImage
);

module.exports = router;
