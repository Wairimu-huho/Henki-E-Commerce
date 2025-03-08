// controllers/reviewController.js
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (owner only)
const updateReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  
  const review = await Review.findById(req.params.reviewId);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Update fields
  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;
  
  const updatedReview = await review.save();
  
  res.json(updatedReview);
});

// Other review controller functions...

module.exports = {
  updateReview,
  // Export other functions...
};