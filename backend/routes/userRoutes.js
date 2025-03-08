const express = require('express');
const router = express.Router();
const {
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  requestPasswordReset,
  resetPassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.put('/profile', protect, updateUserProfile);
router.post('/address', protect, addUserAddress);
router.put('/address/:addressId', protect, updateUserAddress);
router.delete('/address/:addressId', protect, deleteUserAddress);

// Public routes
router.post('/reset-password', requestPasswordReset);
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;
