const express = require('express');
const router = express.Router();
const {
  searchProducts,
  getProductSuggestions,
  getTrendingSearches
} = require('../controllers/searchController');

// Search and filter routes
router.get('/products', searchProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/trending', getTrendingSearches);

module.exports = router;