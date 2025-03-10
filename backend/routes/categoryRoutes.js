const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.route('/')
  .get(getCategories);

router.get('/hierarchy', getCategoryHierarchy);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Admin routes
router.route('/')
  .post(protect, admin, createCategory);

router.route('/:id')
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;