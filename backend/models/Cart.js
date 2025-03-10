const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
    default: 1,
    min: 1
  },
  variant: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Calculate item subtotal
cartItemSchema.virtual('subtotal').get(function() {
  return this.price * this.quantity;
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: {
    type: String,
    required: function() {
      return !this.user;
    }
  },
  items: [cartItemSchema],
  appliedCoupon: {
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
  shippingMethod: {
    name: String,
    price: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate cart subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

// Calculate discount amount
cartSchema.virtual('discount').get(function() {
  if (!this.appliedCoupon || !this.appliedCoupon.code) {
    return 0;
  }

  if (this.appliedCoupon.discountType === 'percentage') {
    return (this.subtotal * this.appliedCoupon.discountValue) / 100;
  } else if (this.appliedCoupon.discountType === 'fixed') {
    return this.appliedCoupon.discountValue;
  }
  
  return 0;
});

// Calculate shipping cost
cartSchema.virtual('shipping').get(function() {
  return this.shippingMethod && this.shippingMethod.price ? this.shippingMethod.price : 0;
});

// Calculate total with discount and shipping
cartSchema.virtual('total').get(function() {
  return this.subtotal - this.discount + this.shipping;
});

// Calculate total items count
cartSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;