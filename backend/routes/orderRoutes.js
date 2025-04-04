const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  getOrders,
  cancelOrder,
  getOrderSummary
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes - put specific routes first
router.route('/summary')
  .get(protect, admin, getOrderSummary);

// Customer routes
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);  // Admin route to get all orders

router.route('/myorders')
  .get(protect, getMyOrders);

// These specific routes must come before the /:id route
router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

// This general route must come last
router.route('/:id')
  .get(protect, getOrderById);

module.exports = router;