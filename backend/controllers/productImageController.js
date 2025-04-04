const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../utils/cloudinaryConfig');

// @desc    Upload product main image
// @route   POST /api/products/:id/upload-image
// @access  Private/Seller or Admin
const uploadProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is product owner or admin
  if (
    product.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  try {
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
    // Delete file from server if there was an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500);
    throw new Error(`Image upload failed: ${error.message}`);
  }
});

// @desc    Upload additional product images
// @route   POST /api/products/:id/upload-additional-images
// @access  Private/Seller or Admin
const uploadAdditionalProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is product owner or admin
  if (
    product.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Please upload at least one image file');
  }

  try {
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
    // Delete files from server if there was an error
    req.files.forEach(file => {
      if (file.path) {
        fs.unlinkSync(file.path);
      }
    });
    
    res.status(500);
    throw new Error(`Image upload failed: ${error.message}`);
  }
});

// @desc    Delete additional product image
// @route   DELETE /api/products/:id/delete-image/:imageIndex
// @access  Private/Seller or Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is product owner or admin
  if (
    product.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  const imageIndex = parseInt(req.params.imageIndex);
  
  if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= product.additionalImages.length) {
    res.status(400);
    throw new Error('Invalid image index');
  }

  const imageUrl = product.additionalImages[imageIndex];
  
  try {
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
    res.status(500);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
});

module.exports = {
  uploadProductImage,
  uploadAdditionalProductImages,
  deleteProductImage
};