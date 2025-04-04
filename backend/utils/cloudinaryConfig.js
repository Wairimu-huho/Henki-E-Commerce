// utils/cloudinaryConfig.js
require('dotenv').config(); // Direct import of dotenv
const cloudinary = require('cloudinary').v2;

// Debug information
console.log('Attempting to configure Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'direct_config_used',
  api_key: process.env.CLOUDINARY_API_KEY || 'direct_config_used',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// Configure with direct values as fallback if env variables aren't available
cloudinary.config({
  // Use environment variables first, then fall back to direct values
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dwjmzbinj",
  api_key: process.env.CLOUDINARY_API_KEY || "631293355919453",
  api_secret: process.env.CLOUDINARY_API_SECRET || "ooP80jQO_loRWkHpLiLkNQrb1nc"
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the image file
 * @param {string} folder - Cloudinary folder to upload to
 * @returns {Promise} Cloudinary upload result
 */
const uploadImage = async (filePath, folder = 'ecommerce-profiles') => {
  try {
    console.log(`Attempting to upload image to Cloudinary folder: ${folder}`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image'
    });
    console.log('Upload successful, image URL:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise} Cloudinary delete result
 */
const deleteImage = async (publicId) => {
  try {
    console.log(`Attempting to delete image from Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Delete result:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = { uploadImage, deleteImage };