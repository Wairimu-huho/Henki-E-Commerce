const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the image file
 * @param {string} folder - Cloudinary folder to upload to
 * @returns {Promise} Cloudinary upload result
 */
const uploadImage = async (filePath, folder = 'ecommerce-profiles') => {
  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image'
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise} Cloudinary delete result
 */
const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, deleteImage };