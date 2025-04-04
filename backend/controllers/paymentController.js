const asyncHandler = require('express-async-handler');
const mpesaAPI = require('../utils/mpesaAPI');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../utils/emailService');

// Store checkout request IDs for validation
// In production, this should be stored in a database
const checkoutRequests = new Map();

// @desc    Initiate M-Pesa payment
// @route   POST /api/payments/mpesa/initiate
// @access  Private
const initiateMpesaPayment = asyncHandler(async (req, res) => {
  const { orderId, phoneNumber } = req.body;
  
  if (!orderId || !phoneNumber) {
    res.status(400);
    throw new Error('Order ID and phone number are required');
  }
  
  // Get order details
  const order = await Order.findById(orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Check if user is authorized
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }
  
  // Check if order is already paid
  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }
  
  try {
    // Initiate STK Push
    const response = await mpesaAPI.initiateSTKPush({
      phoneNumber,
      amount: Math.round(order.totalPrice), // M-Pesa requires whole numbers
      referenceCode: order.orderNumber,
      description: `Payment for order #${order.orderNumber}`
    });
    
    // Store checkout request for validation
    checkoutRequests.set(response.CheckoutRequestID, {
      orderId,
      merchantRequestId: response.MerchantRequestID,
      timestamp: new Date()
    });
    
    // Return response to client
    res.json({
      success: true,
      message: 'Payment initiated. Please check your phone to complete the transaction.',
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Payment initiation failed: ${error.message}`);
  }
});

// @desc    Check M-Pesa payment status
// @route   GET /api/payments/mpesa/status/:checkoutRequestId
// @access  Private
const checkMpesaPaymentStatus = asyncHandler(async (req, res) => {
  const { checkoutRequestId } = req.params;
  
  if (!checkoutRequestId) {
    res.status(400);
    throw new Error('Checkout request ID is required');
  }
  
  // Check if checkout request exists
  const checkoutData = checkoutRequests.get(checkoutRequestId);
  
  if (!checkoutData) {
    res.status(404);
    throw new Error('Checkout request not found or expired');
  }
  
  // Get order
  const order = await Order.findById(checkoutData.orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Check if user is authorized
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to check this payment');
  }
  
  try {
    // Check transaction status
    const statusResponse = await mpesaAPI.checkTransactionStatus(checkoutRequestId);
    
    if (statusResponse.ResultCode === 0) {
      // Transaction successful
      
      // Update order
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'processing';
      order.paymentResult = {
        id: statusResponse.CheckoutRequestID,
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        paymentMethod: 'M-Pesa'
      };
      
      await order.save();
      
      // Remove checkout request from map
      checkoutRequests.delete(checkoutRequestId);
      
      // Send order confirmation email
      try {
        const user = await User.findById(order.user);
        await sendOrderConfirmation(order, user);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
      
      res.json({
        success: true,
        message: 'Payment successful',
        isPaid: true,
        status: 'processing'
      });
    } else {
      // Transaction failed or pending
      res.json({
        success: false,
        message: statusResponse.ResultDesc || 'Payment not completed',
        isPaid: false,
        status: order.status
      });
    }
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to check payment status: ${error.message}`);
  }
});

// @desc    M-Pesa callback handler
// @route   POST /api/payments/mpesa/callback
// @access  Public
const handleMpesaCallback = asyncHandler(async (req, res) => {
  // Return success response immediately to M-Pesa
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  
  // Process callback in background
  try {
    const { Body } = req.body;
    
    // Log callback for debugging
    console.log('M-Pesa callback received:', JSON.stringify(req.body));
    
    if (!Body || !Body.stkCallback) {
      console.error('Invalid M-Pesa callback format');
      return;
    }
    
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata
    } = Body.stkCallback;
    
    // Find checkout request
    const checkoutData = checkoutRequests.get(CheckoutRequestID);
    
    if (!checkoutData) {
      console.error('Checkout request not found:', CheckoutRequestID);
      return;
    }
    
    // Get order
    const order = await Order.findById(checkoutData.orderId);
    
    if (!order) {
      console.error('Order not found:', checkoutData.orderId);
      return;
    }
    
    if (ResultCode === 0) {
      // Transaction successful
      // Extract metadata
      const metadata = {};
      
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          if (item.Name && item.Value) {
            metadata[item.Name] = item.Value;
          }
        });
      }
      
      // Update order
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'processing';
      order.paymentResult = {
        id: metadata.MpesaReceiptNumber || CheckoutRequestID,
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        email_address: '',
        paymentMethod: 'M-Pesa'
      };
      
      await order.save();
      
      // Remove checkout request from map
      checkoutRequests.delete(CheckoutRequestID);
      
      // Send order confirmation email
      const user = await User.findById(order.user);
      await sendOrderConfirmation(order, user);
      
      console.log(`Order ${order.orderNumber} marked as paid via M-Pesa`);
    } else {
      // Transaction failed
      console.error(`M-Pesa payment failed for order ${order.orderNumber}: ${ResultDesc}`);
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
  }
});

// Cleanup old checkout requests (run periodically)
const cleanupCheckoutRequests = () => {
  const now = new Date();
  
  for (const [key, value] of checkoutRequests.entries()) {
    // Remove entries older than 1 hour
    if (now - value.timestamp > 60 * 60 * 1000) {
      checkoutRequests.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupCheckoutRequests, 60 * 60 * 1000);

module.exports = {
  initiateMpesaPayment,
  checkMpesaPaymentStatus,
  handleMpesaCallback
};
