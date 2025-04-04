const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getRelatedProducts
} = require('../controllers/productController');

// Import review controller functions
const {
  createReview,
  getProductReviews,
  getProductReviewStats
} = require('../controllers/reviewController');

const { protect, seller } = require('../middleware/authMiddleware');

// Public routes
router.route('/')
  .get(getProducts);

router.get('/top', getTopProducts);
router.get('/featured', getFeaturedProducts);
router.get('/sale', getSaleProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);

router.route('/:id')
  .get(getProductById);

// Review routes - updated to use the new controller
router.route('/:id/reviews')
  .post(protect, createReview)      // Create a review (using new controller)
  .get(getProductReviews);          // Get all reviews for a product

router.get('/:id/review-stats', getProductReviewStats);  // Get review statistics

// Protected routes
router.route('/')
  .post(protect, seller, createProduct);

router.route('/:id')
  .put(protect, seller, updateProduct)
  .delete(protect, seller, deleteProduct);

module.exports = router;