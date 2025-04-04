const express = require('express');
const router = express.Router();
const {
  initiateMpesaPayment,
  checkMpesaPaymentStatus,
  handleMpesaCallback
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.post('/mpesa/initiate', protect, initiateMpesaPayment);
router.get('/mpesa/status/:checkoutRequestId', protect, checkMpesaPaymentStatus);

// Callback route (public - accessed by M-Pesa servers)
router.post('/mpesa/callback', handleMpesaCallback);

module.exports = router;