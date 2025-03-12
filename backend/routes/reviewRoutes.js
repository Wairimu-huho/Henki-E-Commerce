const express = require('express');
const router = express.Router();
const {
  getReviewById,
  updateReview,
  deleteReview,
  voteReview,
  getUserReviews
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

// Product-specific review routes are in productRoutes.js

// Individual review routes
router.route('/:id')
  .get(getReviewById)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

router.route('/:id/vote')
  .post(protect, voteReview);

router.route('/my-reviews')
  .get(protect, getUserReviews);

module.exports = router;