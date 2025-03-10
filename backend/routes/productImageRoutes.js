// routes/productImageRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { protect, seller } = require('../middleware/authMiddleware');
const { productImageUpload } = require('../middleware/uploadMiddleware');
const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../utils/cloudinaryConfig');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload product main image
// @route   POST /api/products/:id/upload-image
// @access  Private/Seller or Admin
router.post(
  '/:id/upload-image',
  protect,
  seller,
  productImageUpload.single('image'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if user is product owner or admin
      if (
        product.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image file' });
      }

      console.log('File uploaded to server:', req.file.path);

      // Upload to cloudinary
      const result = await uploadImage(req.file.path, 'ecommerce-products');
      
      // If product already has an image, delete the old one
      if (product.image && product.image.includes('cloudinary')) {
        // Extract public_id from the URL
        const publicId = product.image
          .split('/')
          .slice(-1)[0]
          .split('.')[0];
          
        if (publicId) {
          await deleteImage(`ecommerce-products/${publicId}`);
        }
      }

      // Update product image
      product.image = result.secure_url;
      await product.save();
      
      // Delete file from server after upload
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Product image uploaded successfully',
        image: product.image
      });
    } catch (error) {
      console.error('Error in upload route:', error);
      
      // Delete file from server if there was an error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        message: `Image upload failed: ${error.message}`,
        error: error.toString()
      });
    }
  }
);

// @desc    Upload additional product images
// @route   POST /api/products/:id/upload-additional-images
// @access  Private/Seller or Admin
router.post(
  '/:id/upload-additional-images',
  protect,
  seller,
  productImageUpload.array('images', 5), // Allow up to 5 images at once
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if user is product owner or admin
      if (
        product.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Please upload at least one image file' });
      }

      console.log(`Uploading ${req.files.length} additional images`);

      const uploadPromises = req.files.map(file => 
        uploadImage(file.path, 'ecommerce-products')
      );
      
      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(result => result.secure_url);
      
      // Add new images to the product's additionalImages array
      product.additionalImages = [
        ...product.additionalImages,
        ...imageUrls
      ];
      
      await product.save();
      
      // Delete files from server after upload
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });

      res.json({
        message: 'Additional product images uploaded successfully',
        additionalImages: product.additionalImages
      });
    } catch (error) {
      console.error('Error in additional images upload:', error);
      
      // Delete files from server if there was an error
      if (req.files) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      res.status(500).json({
        message: `Image upload failed: ${error.message}`,
        error: error.toString()
      });
    }
  }
);

// @desc    Delete additional product image
// @route   DELETE /api/products/:id/delete-image/:imageIndex
// @access  Private/Seller or Admin
router.delete(
  '/:id/delete-image/:imageIndex',
  protect,
  seller,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if user is product owner or admin
      if (
        product.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }

      const imageIndex = parseInt(req.params.imageIndex);
      
      if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= product.additionalImages.length) {
        return res.status(400).json({ message: 'Invalid image index' });
      }

      const imageUrl = product.additionalImages[imageIndex];
      
      // Extract public_id from the URL
      if (imageUrl && imageUrl.includes('cloudinary')) {
        const publicId = imageUrl
          .split('/')
          .slice(-1)[0]
          .split('.')[0];
          
        if (publicId) {
          await deleteImage(`ecommerce-products/${publicId}`);
        }
      }
      
      // Remove image from additionalImages array
      product.additionalImages.splice(imageIndex, 1);
      await product.save();

      res.json({
        message: 'Product image deleted successfully',
        additionalImages: product.additionalImages
      });
    } catch (error) {
      console.error('Error in delete image:', error);
      res.status(500).json({
        message: `Image deletion failed: ${error.message}`,
        error: error.toString()
      });
    }
  }
);

module.exports = router;