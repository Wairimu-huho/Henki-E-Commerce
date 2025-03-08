// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { 
  updateReview,
  // Other controller functions...
} = require('../controllers/reviewController');
const { protect, resourceOwner } = require('../middleware/authMiddleware');
const Review = require('../models/Review');

// This is where you apply the resourceOwner middleware
router.put(
  '/:reviewId',
  protect,
  resourceOwner(Review, 'reviewId'),
  updateReview
);

// Other review routes...

module.exports = router;