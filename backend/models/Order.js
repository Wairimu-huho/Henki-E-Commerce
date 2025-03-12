const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  }
});

const paymentResultSchema = new mongoose.Schema({
  id: {
    type: String
  },
  status: {
    type: String
  },
  update_time: {
    type: String
  },
  email_address: {
    type: String
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'PayPal'
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    required: true,
    default: 'PayPal'
  },
  paymentResult: paymentResultSchema,
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  discountPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  couponApplied: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'shipping'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      default: 0
    }
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Generate unique order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate the date part (YYYYMMDD)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    
    // Find the highest order number for today
    const highestOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^${datePart}`)
    }).sort({ orderNumber: -1 });
    
    // Calculate next sequence number
    let sequenceNumber = '0001';
    if (highestOrder && highestOrder.orderNumber) {
      const currentSequence = parseInt(highestOrder.orderNumber.slice(-4));
      sequenceNumber = String(currentSequence + 1).padStart(4, '0');
    }
    
    // Set the order number
    this.orderNumber = `${datePart}${sequenceNumber}`;
    
    // Generate invoice number if not set
    if (!this.invoiceNumber) {
      this.invoiceNumber = `INV-${this.orderNumber}`;
    }
  }
  next();
});

// Index for user to quickly find their orders
orderSchema.index({ user: 1, createdAt: -1 });

// Index for order status queries (common filter in admin panels)
orderSchema.index({ status: 1 });

// Index for order number searches (used in customer service)
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Compound index for date-range queries with status
orderSchema.index({ createdAt: 1, status: 1 });

// Payment status indexes
orderSchema.index({ isPaid: 1 });
orderSchema.index({ isDelivered: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;