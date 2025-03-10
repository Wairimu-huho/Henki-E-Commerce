const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getRelatedProducts
} = require('../controllers/productController');
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

router.route('/:id/reviews')
  .post(protect, createProductReview);

// Protected routes
router.route('/')
  .post(protect, seller, createProduct);

router.route('/:id')
  .put(protect, seller, updateProduct)
  .delete(protect, seller, deleteProduct);

module.exports = router;