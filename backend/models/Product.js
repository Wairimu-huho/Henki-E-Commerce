const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const productVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  countInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String
  },
  attributes: {
    type: Map,
    of: String
  }
});

const productSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  additionalImages: [String],
  brand: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category'
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  countInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  variants: [productVariantSchema],
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  featured: {
    type: Boolean,
    default: false
  },
  isSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: 0
  },
  saleEndDate: {
    type: Date
  },
  tags: [String],
  specifications: {
    type: Map,
    of: String
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      default: 'kg'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for getting the current price (sale price or regular price)
productSchema.virtual('currentPrice').get(function() {
  if (this.isSale && this.salePrice && (!this.saleEndDate || new Date(this.saleEndDate) > new Date())) {
    return this.salePrice;
  }
  return this.price;
});

// Middleware to update rating when reviews are modified
productSchema.pre('save', async function(next) {
  if (this.isModified('reviews')) {
    if (this.reviews.length === 0) {
      this.rating = 0;
      this.numReviews = 0;
    } else {
      const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      this.rating = totalRating / this.reviews.length;
      this.numReviews = this.reviews.length;
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;