const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const fs = require('fs');
const { uploadImage, deleteImage } = require('../utils/cloudinaryConfig');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Basic profile updates
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  
  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role
  });
});

// @desc    Add user address
// @route   POST /api/users/address
// @access  Private
const addUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { street, city, state, postalCode, country, isDefault } = req.body;

  // Create new address object
  const newAddress = {
    street,
    city,
    state,
    postalCode,
    country,
    isDefault: isDefault || false
  };

  // If this address is set as default, update all other addresses
  if (newAddress.isDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  // Add new address to addresses array
  user.addresses.push(newAddress);
  await user.save();

  res.status(201).json({ addresses: user.addresses });
});

// @desc    Update user address
// @route   PUT /api/users/address/:addressId
// @access  Private
const updateUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Find address by ID
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // Update address fields
  address.street = req.body.street || address.street;
  address.city = req.body.city || address.city;
  address.state = req.body.state || address.state;
  address.postalCode = req.body.postalCode || address.postalCode;
  address.country = req.body.country || address.country;
  
  // Handle default address
  if (req.body.isDefault) {
    // If this address is being set as default, unset others
    user.addresses.forEach(addr => {
      if (!addr._id.equals(address._id)) {
        addr.isDefault = false;
      }
    });
    address.isDefault = true;
  }

  await user.save();
  res.json({ addresses: user.addresses });
});

// @desc    Delete user address
// @route   DELETE /api/users/address/:addressId
// @access  Private
const deleteUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Find address by ID
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // Remove address
  address.remove();
  await user.save();

  res.json({ addresses: user.addresses });
});

// @desc    Request password reset
// @route   POST /api/users/reset-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  // In a real application, you would send an email with the reset token
  // For development purposes, we'll just return it in the response
  res.json({
    message: 'Password reset email sent',
    resetToken // In production, don't send this in the response!
  });
});

// @desc    Reset password
// @route   PUT /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: 'Password reset successful' });
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image file');
    }
  
    try {
      // Upload to cloudinary
      const result = await uploadImage(req.file.path, 'ecommerce-profiles');
      
      // If user already has a profile picture, delete the old one
      if (user.profilePicture && user.profilePicture.publicId) {
        await deleteImage(user.profilePicture.publicId);
      }
  
      // Update user profile picture
      user.profilePicture = {
        url: result.secure_url,
        publicId: result.public_id
      };
  
      await user.save();
      
      // Delete file from server after upload
      fs.unlinkSync(req.file.path);
  
      res.json({
        message: 'Profile picture uploaded successfully',
        profilePicture: user.profilePicture
      });
    } catch (error) {
      // Delete file from server if there was an error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500);
      throw new Error(`Profile picture upload failed: ${error.message}`);
    }
});

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/delete-picture
// @access  Private
const deleteProfilePicture = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    // If user has a custom profile picture
    if (user.profilePicture && user.profilePicture.publicId) {
      // Delete from cloudinary
      await deleteImage(user.profilePicture.publicId);
  
      // Reset to default
      user.profilePicture = {
        url: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/default-profile.png',
        publicId: null
      };
  
      await user.save();
  
      res.json({
        message: 'Profile picture deleted successfully',
        profilePicture: user.profilePicture
      });
    } else {
      res.status(400);
      throw new Error('No custom profile picture to delete');
    }
});

module.exports = {
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  requestPasswordReset,
  resetPassword,
  uploadProfilePicture,
  deleteProfilePicture
};