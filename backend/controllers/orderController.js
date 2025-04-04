const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const {
  sendOrderConfirmation,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendCancellationNotification
} = require('../utils/emailService');
const User = require('../models/User');

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod,
    taxRate = 0.0
  } = req.body;

  // Validation
  if (!shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Shipping address and payment method are required');
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price image countInStock'
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  // Validate item availability
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Product ${item.name} not found`);
    }

    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough ${product.name} in stock. Only ${product.countInStock} available.`);
    }
  }

  // Calculate prices
  const itemsPrice = cart.subtotal;
  const shippingPrice = cart.shipping;
  const discountPrice = cart.discount;
  
  // Calculate tax
  const taxPrice = (itemsPrice - discountPrice) * taxRate;
  
  // Calculate total
  const totalPrice = itemsPrice - discountPrice + shippingPrice + taxPrice;

  // Generate order number (since the pre-save hook isn't working correctly)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // Find the highest order number for today
  const highestOrder = await Order.findOne({
    orderNumber: new RegExp(`^${datePart}`)
  }).sort({ orderNumber: -1 });
  
  // Calculate next sequence number
  let sequenceNumber = '0001';
  if (highestOrder && highestOrder.orderNumber) {
    const currentSequence = parseInt(highestOrder.orderNumber.slice(-4));
    sequenceNumber = String(currentSequence + 1).padStart(4, '0');
  }
  
  // Create the order number
  const orderNumber = `${datePart}${sequenceNumber}`;
  const invoiceNumber = `INV-${orderNumber}`;

  // Create order
  const order = new Order({
    user: req.user._id,
    orderItems: cart.items.map(item => ({
      product: item.product._id,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      variant: item.variant
    })),
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountPrice,
    totalPrice,
    couponApplied: cart.appliedCoupon,
    orderNumber, // Add the generated order number
    invoiceNumber // Add the generated invoice number
  });

  // Save order
  const createdOrder = await order.save();

  // Send order confirmation email
  try {
    const user = await User.findById(req.user._id);
    await sendOrderConfirmation(createdOrder, user);
    console.log(`Order confirmation email sent for order ${orderNumber}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't block the order creation if email fails
  }

  // Update product quantities
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    product.countInStock -= item.quantity;
    await product.save();
  }

  // Clear the cart
  cart.items = [];
  cart.appliedCoupon = undefined;
  cart.shippingMethod = undefined;
  await cart.save();

  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the user is authorized to see this order
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this order');
  }

  res.json(order);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  const count = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    totalOrders: count
  });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the user is authorized to update this order
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Update order
  order.isPaid = true;
  order.paidAt = Date.now();
  order.status = 'processing';
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address,
    paymentMethod: order.paymentMethod
  };

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, notes } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update order status
  order.status = status || order.status;
  
  // Update tracking info if provided
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }
  
  // Update notes if provided
  if (notes) {
    order.notes = notes;
  }
  
  // If status is delivered, update delivery info
  if (status === 'delivered' && !order.isDelivered) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  
  // Send shipping notification email when order is shipped
  try {
    if (status === 'shipped' && order.status !== 'shipped') {
      const user = await User.findById(order.user);
      const trackingInfo = {
        trackingNumber: trackingNumber || 'N/A',
        carrier: 'Our Shipping Partner',
        trackingUrl: trackingNumber ? `https://tracking.example.com/${trackingNumber}` : '#',
        estimatedDelivery: '3-5 business days'
      };
      await sendShippingNotification(updatedOrder, user, trackingInfo);
      console.log(`Shipping notification email sent for order ${updatedOrder.orderNumber}`);
    } 
    // Send delivery confirmation email when order is delivered
    else if (status === 'delivered' && !order.isDelivered) {
      const user = await User.findById(order.user);
      await sendDeliveryConfirmation(updatedOrder, user);
      console.log(`Delivery confirmation email sent for order ${updatedOrder.orderNumber}`);
    }
  } catch (error) {
    console.error('Failed to send order status email:', error);
    // Don't block the status update if email fails
  }

  res.json(updatedOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  // Query filters
  const status = req.query.status ? { status: req.query.status } : {};
  const isPaid = req.query.isPaid ? { isPaid: req.query.isPaid === 'true' } : {};
  const isDelivered = req.query.isDelivered ? { isDelivered: req.query.isDelivered === 'true' } : {};
  
  const keyword = req.query.keyword
    ? {
        $or: [
          { orderNumber: { $regex: req.query.keyword, $options: 'i' } },
          { invoiceNumber: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};
  
  // Date range
  const dateRange = {};
  if (req.query.startDate) {
    dateRange.createdAt = { ...dateRange.createdAt, $gte: new Date(req.query.startDate) };
  }
  if (req.query.endDate) {
    const endDate = new Date(req.query.endDate);
    endDate.setDate(endDate.getDate() + 1); // Include entire end date
    dateRange.createdAt = { ...dateRange.createdAt, $lt: endDate };
  }
  
  const count = await Order.countDocuments({
    ...status,
    ...isPaid,
    ...isDelivered,
    ...keyword,
    ...dateRange
  });
  
  const orders = await Order.find({
    ...status,
    ...isPaid,
    ...isDelivered,
    ...keyword,
    ...dateRange
  })
    .populate('user', 'id name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    totalOrders: count
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the user is authorized to cancel this order
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled when status is ${order.status}`);
  }

  // Update order
  order.status = 'cancelled';

  // Restore product quantities
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock += item.quantity;
      await product.save();
    }
  }

  const updatedOrder = await order.save();
  
  // Send cancellation notification email
  try {
    const user = await User.findById(order.user);
    const reason = req.body.cancellationReason || 'Customer request';
    await sendCancellationNotification(updatedOrder, user, reason);
    console.log(`Cancellation notification email sent for order ${updatedOrder.orderNumber}`);
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    // Don't block the cancellation if email fails
  }

  res.json(updatedOrder);
});

// @desc    Get order summary (for admin dashboard)
// @route   GET /api/orders/summary
// @access  Private/Admin
const getOrderSummary = asyncHandler(async (req, res) => {
  // Total orders
  const totalOrders = await Order.countDocuments();
  
  // Total sales
  const totalSales = await Order.aggregate([
    {
      $match: { isPaid: true }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalPrice' }
      }
    }
  ]);
  
  // Orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });
  
  // Today's sales
  const todaySales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
        isPaid: true
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalPrice' }
      }
    }
  ]);
  
  // Sales by date (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);
  
  const salesByDate = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: last7Days },
        isPaid: true
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalSales: { $sum: '$totalPrice' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
        '_id.day': 1
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        totalSales: 1,
        count: 1,
        _id: 0
      }
    }
  ]);
  
  res.json({
    totalOrders,
    totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0,
    ordersByStatus,
    todayOrders,
    todaySales: todaySales.length > 0 ? todaySales[0].totalSales : 0,
    salesByDate
  });
});

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  getOrders,
  cancelOrder,
  getOrderSummary
};