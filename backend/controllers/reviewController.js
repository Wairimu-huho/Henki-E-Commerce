const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;
  const productId = req.params.id;

  // Validate inputs
  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Verify that user has purchased the product
  // Optional: remove this check if you want to allow any user to review
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    status: { $in: ['delivered', 'completed'] }
  });

  if (!hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased');
  }

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    review => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Create review object
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
    title: title || `Review by ${req.user.name}`
  };

  // Add review to product
  product.reviews.push(review);
  
  // Update product rating (handled by pre-save middleware)
  await product.save();

  res.status(201).json({
    message: 'Review added successfully',
    review: product.reviews[product.reviews.length - 1]
  });
});

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'createdAt:desc'; // Default sort by newest
  const ratingFilter = req.query.rating ? Number(req.query.rating) : null;

  // Find product and populate user info
  const product = await Product.findById(productId)
    .select('reviews')
    .populate('reviews.user', 'name profilePicture');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Apply filters
  let reviews = [...product.reviews];
  
  if (ratingFilter) {
    reviews = reviews.filter(review => review.rating === ratingFilter);
  }

  // Apply sorting
  const [sortField, sortDirection] = sortBy.split(':');
  reviews.sort((a, b) => {
    if (sortDirection === 'desc') {
      return sortField === 'rating' 
        ? b.rating - a.rating
        : new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return sortField === 'rating'
        ? a.rating - b.rating
        : new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  // Generate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: Math.round(reviews.filter(review => review.rating === rating).length / reviews.length * 100) || 0
  }));

  res.json({
    reviews: paginatedReviews,
    page,
    pages: Math.ceil(reviews.length / limit),
    totalReviews: reviews.length,
    averageRating: product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0,
    ratingBreakdown
  });
});

// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  
  // Find product containing the review
  const product = await Product.findOne({ 'reviews._id': reviewId })
    .select('name slug reviews.$')
    .populate('reviews.user', 'name profilePicture');
  
  if (!product || !product.reviews || product.reviews.length === 0) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  const review = product.reviews[0];
  
  res.json({
    review,
    productName: product.name,
    productSlug: product.slug
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;
  const reviewId = req.params.id;
  
  // Find product containing the review
  const product = await Product.findOne({ 'reviews._id': reviewId });
  
  if (!product) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Find the review in the product
  const review = product.reviews.id(reviewId);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Check if user is the review owner
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }
  
  // Update review fields
  if (rating) {
    if (rating < 1 || rating > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }
    review.rating = Number(rating);
  }
  
  if (comment) {
    review.comment = comment;
  }
  
  if (title) {
    review.title = title;
  }
  
  // Save the updated product (and review)
  await product.save();
  
  res.json({
    message: 'Review updated successfully',
    review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  
  // Find product containing the review
  const product = await Product.findOne({ 'reviews._id': reviewId });
  
  if (!product) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Find the review in the product
  const review = product.reviews.id(reviewId);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Check if user is the review owner or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }
  
  // Remove the review
  review.remove();
  
  // Save the updated product
  await product.save();
  
  res.json({ message: 'Review deleted successfully' });
});

// @desc    Mark review as helpful/unhelpful
// @route   POST /api/reviews/:id/vote
// @access  Private
const voteReview = asyncHandler(async (req, res) => {
  const { isHelpful } = req.body;
  const reviewId = req.params.id;
  
  if (isHelpful === undefined) {
    res.status(400);
    throw new Error('isHelpful field is required');
  }
  
  // Find product containing the review
  const product = await Product.findOne({ 'reviews._id': reviewId });
  
  if (!product) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Find the review in the product
  const review = product.reviews.id(reviewId);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Check if user is not the review owner (can't vote on own review)
  if (review.user.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot vote on your own review');
  }
  
  // Initialize helpfulVotes array if it doesn't exist
  if (!review.helpfulVotes) {
    review.helpfulVotes = [];
  }
  
  // Check if user has already voted
  const existingVoteIndex = review.helpfulVotes.findIndex(
    vote => vote.user.toString() === req.user._id.toString()
  );
  
  if (existingVoteIndex >= 0) {
    // Update existing vote
    review.helpfulVotes[existingVoteIndex].isHelpful = isHelpful;
  } else {
    // Add new vote
    review.helpfulVotes.push({
      user: req.user._id,
      isHelpful
    });
  }
  
  // Calculate helpful count
  const helpfulCount = review.helpfulVotes.filter(vote => vote.isHelpful).length;
  const totalVotes = review.helpfulVotes.length;
  
  // Save the updated product
  await product.save();
  
  res.json({
    message: 'Vote recorded successfully',
    helpfulCount,
    totalVotes,
    helpfulPercentage: totalVotes > 0 ? Math.round(helpfulCount / totalVotes * 100) : 0
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getUserReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  
  // Aggregation pipeline to find all user's reviews across products
  const userReviews = await Product.aggregate([
    // Unwind reviews array
    { $unwind: '$reviews' },
    // Match reviews by user
    { $match: { 'reviews.user': mongoose.Types.ObjectId(req.user._id) } },
    // Project needed fields
    { 
      $project: {
        productId: '$_id',
        productName: '$name',
        productImage: '$image',
        productSlug: '$slug',
        review: '$reviews'
      }
    },
    // Sort by review date
    { $sort: { 'review.createdAt': -1 } },
    // Skip and limit for pagination
    { $skip: (page - 1) * limit },
    { $limit: limit }
  ]);
  
  // Count total reviews for pagination
  const total = await Product.aggregate([
    { $unwind: '$reviews' },
    { $match: { 'reviews.user': mongoose.Types.ObjectId(req.user._id) } },
    { $count: 'total' }
  ]);
  
  const totalReviews = total.length > 0 ? total[0].total : 0;
  
  res.json({
    reviews: userReviews,
    page,
    pages: Math.ceil(totalReviews / limit),
    totalReviews
  });
});

// @desc    Get product review statistics
// @route   GET /api/products/:id/review-stats
// @access  Public
const getProductReviewStats = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  // Find product
  const product = await Product.findById(productId).select('reviews');
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Calculate stats
  const totalReviews = product.reviews.length;
  const averageRating = totalReviews > 0
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  
  // Generate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: product.reviews.filter(review => review.rating === rating).length,
    percentage: Math.round(product.reviews.filter(review => review.rating === rating).length / totalReviews * 100) || 0
  }));
  
  res.json({
    productId,
    totalReviews,
    averageRating,
    ratingBreakdown
  });
});

module.exports = {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
  deleteReview,
  voteReview,
  getUserReviews,
  getProductReviewStats
};