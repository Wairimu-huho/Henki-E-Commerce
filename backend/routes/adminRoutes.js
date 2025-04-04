const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const {
  updateUserRole,
  getUsers,
  getUserById,
  deleteUser
} = require('../controllers/roleController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected and require admin privileges
router.use(protect, admin);

// Dashboard route
router.get('/dashboard', getDashboardStats);

// User management routes
router.get('/users', getUsers);
router.route('/users/:id')
  .get(getUserById)
  .delete(deleteUser);
router.put('/users/:id/role', updateUserRole);

module.exports = router;