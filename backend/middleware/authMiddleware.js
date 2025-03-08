const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes - Verifies the JWT token and attaches user to request
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware - Ensures user is an admin
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Admin privileges required');
  }
});

// Seller middleware - Ensures user is a seller or admin
const seller = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Seller privileges required');
  }
});

// Customer middleware - Ensures user is at least a customer (any authenticated user)
const customer = asyncHandler(async (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Customer privileges required');
  }
});

// Resource owner middleware - Ensures user owns the resource or is admin
const resourceOwner = (resourceModel, resourceIdParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    
    // Admin always has access
    if (req.user.role === 'admin') {
      return next();
    }
    
    try {
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        res.status(404);
        throw new Error('Resource not found');
      }
      
      // Check if the user owns this resource
      // This assumes your resource has a 'user' field with the owner's ID
      // Adjust the comparison as needed for your data models
      if (resource.user && resource.user.toString() === req.user._id.toString()) {
        return next();
      }
      
      res.status(403);
      throw new Error('Access denied. You do not own this resource');
      
    } catch (error) {
      if (error.message === 'Resource not found' || 
          error.message === 'Access denied. You do not own this resource') {
        throw error;
      }
      
      res.status(500);
      throw new Error('Server error while checking resource ownership');
    }
  });
};

module.exports = { protect, admin, seller, customer, resourceOwner };