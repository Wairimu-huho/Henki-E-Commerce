// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  setShippingMethod,
  testAddToCart  // Make sure to include this in the import
} = require('../controllers/cartController');
const { protect, customer } = require('../middleware/authMiddleware');

// Cart and cart items routes
router.route('/')
  .get(getCart);
  

router.route('/items')
  .post(addItemToCart)
  .delete(clearCart);

router.route('/items/:itemId')
  .put(updateCartItem)
  .delete(removeCartItem);

// Coupon routes
router.route('/apply-coupon')
  .post(applyCoupon);

router.route('/coupon')
  .delete(removeCoupon);

// Shipping method routes
router.route('/shipping-method')
  .post(setShippingMethod);

// Test route
router.post('/test-add', protect, testAddToCart);

module.exports = router;