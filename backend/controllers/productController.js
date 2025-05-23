const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('slugify');
const { getCachedData, clearCache, clearCachePattern } = require('../utils/cacheManager');

// Add this helper function at the top of your file
const buildProductQuery = (queryParams) => {
  const query = {};
  
  if (queryParams.category) {
    query.category = queryParams.category;
  }
  
  if (queryParams.search) {
    query.name = { $regex: queryParams.search, $options: 'i' };
  }
  
  if (queryParams.minPrice || queryParams.maxPrice) {
    query.price = {};
    if (queryParams.minPrice) query.price.$gte = Number(queryParams.minPrice);
    if (queryParams.maxPrice) query.price.$lte = Number(queryParams.maxPrice);
  }

  if (queryParams.isActive !== undefined) {
    query.isActive = queryParams.isActive === 'true';
  }

  return query;
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller or Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    category,
    description,
    price,
    countInStock,
    image,
    additionalImages,
    variants,
    featured,
    isSale,
    salePrice,
    saleEndDate,
    tags,
    specifications,
    dimensions,
    weight
  } = req.body;

  // Check if category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Category not found');
  }

  // Generate slug from name
  const slug = slugify(name, { lower: true });

  // Check if product with slug already exists
  const productExists = await Product.findOne({ slug });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this name already exists');
  }

  // Create product
  const product = await Product.create({
    user: req.user._id,
    name,
    slug,
    brand,
    category,
    description,
    price,
    countInStock,
    image,
    additionalImages: additionalImages || [],
    variants: variants || [],
    featured: featured || false,
    isSale: isSale || false,
    salePrice,
    saleEndDate,
    tags: tags || [],
    specifications: specifications || {},
    dimensions: dimensions || {},
    weight: weight || {}
  });

  if (product) {
    // Clear products cache after successful creation
    clearCachePattern('products:*');
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error('Invalid product data');
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const query = buildProductQuery(req.query);
    const count = await Product.countDocuments(query);
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @desc    Get a product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const cacheKey = `product:${req.params.id}`;
  
  const product = await getCachedData(
    cacheKey,
    async () => {
      return Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('user', 'name')
        .populate({
          path: 'reviews.user',
          select: 'name profilePicture'
        });
    },
    'medium' // Medium cache duration for individual products
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get a product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `product:slug:${req.params.slug}`;
  
  const product = await getCachedData(
    cacheKey,
    async () => {
      return Product.findOne({ slug: req.params.slug })
        .populate('category', 'name')
        .populate('user', 'name')
        .populate({
          path: 'reviews.user',
          select: 'name profilePicture'
        });
    },
    'medium' // Medium cache duration for individual products
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller or Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    category,
    description,
    price,
    countInStock,
    image,
    additionalImages,
    variants,
    featured,
    isSale,
    salePrice,
    saleEndDate,
    tags,
    specifications,
    dimensions,
    weight,
    isActive
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is product owner or admin
  if (
    product.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  // Check if changing name and if new slug would conflict
  if (name && name !== product.name) {
    const newSlug = slugify(name, { lower: true });
    const existingProduct = await Product.findOne({ slug: newSlug });
    
    if (existingProduct && existingProduct._id.toString() !== req.params.id) {
      res.status(400);
      throw new Error('Product with this name already exists');
    }
    
    product.slug = newSlug;
  }

  // Update fields
  product.name = name || product.name;
  product.brand = brand || product.brand;
  
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400);
      throw new Error('Category not found');
    }
    product.category = category;
  }
  
  product.description = description || product.description;
  product.price = price !== undefined ? price : product.price;
  product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
  product.image = image || product.image;
  
  if (additionalImages) {
    product.additionalImages = additionalImages;
  }
  
  if (variants) {
    product.variants = variants;
  }
  
  product.featured = featured !== undefined ? featured : product.featured;
  product.isSale = isSale !== undefined ? isSale : product.isSale;
  product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;
  product.saleEndDate = saleEndDate || product.saleEndDate;
  
  if (tags) {
    product.tags = tags;
  }
  
  if (specifications) {
    product.specifications = specifications;
  }
  
  if (dimensions) {
    product.dimensions = dimensions;
  }
  
  if (weight) {
    product.weight = weight;
  }
  
  product.isActive = isActive !== undefined ? isActive : product.isActive;

  const updatedProduct = await product.save();
  
  // Clear relevant caches
  clearCachePattern('products:*');
  clearCache(`product:${req.params.id}`);
  if (product.slug) {
    clearCache(`product:slug:${product.slug}`);
  }
  
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller or Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is product owner or admin
  if (
    product.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();
  
  // Clear relevant caches
  clearCachePattern('products:*');
  clearCache(`product:${req.params.id}`);
  if (product.slug) {
    clearCache(`product:slug:${product.slug}`);
  }
  
  res.json({ message: 'Product removed' });
});

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  const review = {
    name: req.user.name,
    rating: Number(rating),
    comment,
    user: req.user._id
  };

  product.reviews.push(review);
  
  // Rating and numReviews will be updated by pre-save middleware
  
  await product.save();
  
  // Clear caches for this product
  clearCache(`product:${req.params.id}`);
  if (product.slug) {
    clearCache(`product:slug:${product.slug}`);
  }
  
  res.status(201).json({ message: 'Review added' });
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const cacheKey = `products:top:${limit}`;
  
  const products = await getCachedData(
    cacheKey,
    async () => {
      return Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(limit);
    },
    'medium' // Medium cache duration for top products
  );

  res.json(products);
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const cacheKey = `products:featured:${limit}`;
  
  const products = await getCachedData(
    cacheKey,
    async () => {
      return Product.find({ 
        featured: true,
        isActive: true
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    },
    'medium' // Medium cache duration for featured products
  );

  res.json(products);
});

// @desc    Get sale products
// @route   GET /api/products/sale
// @access  Public
const getSaleProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const cacheKey = `products:sale:${limit}`;
  
  const products = await getCachedData(
    cacheKey,
    async () => {
      return Product.find({ 
        isSale: true,
        saleEndDate: { $gte: new Date() },
        isActive: true
      })
        .sort({ saleEndDate: 1 })
        .limit(limit);
    },
    'short' // Short cache duration for sale products (as they have time sensitivity)
  );

  res.json(products);
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 4;
  const cacheKey = `products:related:${req.params.id}:${limit}`;
  
  const result = await getCachedData(
    cacheKey,
    async () => {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return null;
      }
      
      return Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      })
        .limit(limit);
    },
    'medium' // Medium cache duration for related products
  );
  
  if (result === null) {
    res.status(404);
    throw new Error('Product not found');
  }
    
  res.json(result);
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getRelatedProducts
};