const express = require('express');
const router = express.Router();
const {
  updateUserRole,
  getUsers,
  getUserById,
  deleteUser
} = require('../controllers/roleController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected and require admin privileges
router.use(protect, admin);

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUserById)
  .delete(deleteUser);

router.route('/users/:id/role')
  .put(updateUserRole);

module.exports = router;