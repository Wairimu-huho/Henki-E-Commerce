const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Build search and filter query for products
 * @param {Object} queryParams - Request query parameters
 * @returns {Object} Mongoose query object and filter stats
 */
const buildProductQuery = async (queryParams) => {
  const {
    keyword,
    category,
    brand,
    priceMin,
    priceMax,
    rating,
    inStock,
    tags,
    attributes,
    featured,
    onSale,
    sortBy,
    page = 1,
    limit = 10
  } = queryParams;

  // Base query - only active products
  const query = { isActive: true };
  const stats = { appliedFilters: {} };

  // Text search (keyword)
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { brand: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } }
    ];
    stats.appliedFilters.keyword = keyword;
  }

  // Category filter (including subcategories)
  if (category) {
    let categoryIds = [category];
    
    // Find all subcategories
    try {
      const subcategories = await Category.find({ parent: category });
      if (subcategories.length > 0) {
        categoryIds = [...categoryIds, ...subcategories.map(cat => cat._id)];
      }
      
      query.category = { $in: categoryIds };
      stats.appliedFilters.category = category;
    } catch (err) {
      console.error('Error finding subcategories:', err);
      query.category = category;
    }
  }

  // Brand filter
  if (brand) {
    // Support multiple brands as comma-separated values
    const brands = brand.split(',').map(b => b.trim());
    query.brand = brands.length > 1 ? { $in: brands } : brands[0];
    stats.appliedFilters.brand = brands;
  }

  // Price range filter
  if (priceMin !== undefined || priceMax !== undefined) {
    query.price = {};
    
    if (priceMin !== undefined) {
      query.price.$gte = Number(priceMin);
      stats.appliedFilters.priceMin = Number(priceMin);
    }
    
    if (priceMax !== undefined) {
      query.price.$lte = Number(priceMax);
      stats.appliedFilters.priceMax = Number(priceMax);
    }
  }

  // Rating filter
  if (rating) {
    query.rating = { $gte: Number(rating) };
    stats.appliedFilters.rating = Number(rating);
  }

  // In stock filter
  if (inStock === 'true') {
    query.countInStock = { $gt: 0 };
    stats.appliedFilters.inStock = true;
  }

  // Tags filter
  if (tags) {
    const tagList = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagList };
    stats.appliedFilters.tags = tagList;
  }

  // Attributes filter (for variant products)
  if (attributes) {
    try {
      const attrs = JSON.parse(attributes);
      Object.entries(attrs).forEach(([key, value]) => {
        // Filter products that have variants with matching attributes
        query[`variants.attributes.${key}`] = value;
      });
      stats.appliedFilters.attributes = attrs;
    } catch (e) {
      console.error('Invalid attributes format:', e);
    }
  }

  // Featured products filter
  if (featured === 'true') {
    query.featured = true;
    stats.appliedFilters.featured = true;
  }

  // On sale filter
  if (onSale === 'true') {
    query.isSale = true;
    query.saleEndDate = { $gte: new Date() };
    stats.appliedFilters.onSale = true;
  }

  // Sort options
  const sortOptions = {};
  
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    
    switch (field) {
      case 'price':
        sortOptions.price = direction === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortOptions.name = direction === 'desc' ? -1 : 1;
        break;
      case 'rating':
        sortOptions.rating = direction === 'desc' ? -1 : 1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'popularity':
        sortOptions.numReviews = -1;
        break;
      default:
        sortOptions.createdAt = -1; // Default sort
    }
    
    stats.sortBy = sortBy;
  } else {
    // Default sort
    sortOptions.createdAt = -1;
    stats.sortBy = 'newest';
  }

  return { 
    query, 
    sortOptions, 
    skip: (Number(page) - 1) * Number(limit), 
    limit: Number(limit),
    stats
  };
};

// @desc    Search and filter products
// @route   GET /api/search/products
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { query, sortOptions, skip, limit, stats } = await buildProductQuery(req.query);
  
  // Execute count for pagination
  const totalProducts = await Product.countDocuments(query);
  
  // Execute the query
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
  
  // Get unique brands and price range for filters
  const aggregateFilters = await Product.aggregate([
    { $match: { isActive: true } },
    { 
      $facet: {
        brands: [
          { $group: { _id: '$brand' } },
          { $sort: { _id: 1 } }
        ],
        priceRange: [
          { 
            $group: { 
              _id: null, 
              min: { $min: '$price' }, 
              max: { $max: '$price' } 
            } 
          }
        ],
        ratings: [
          { $group: { _id: { $ceil: '$rating' } } },
          { $sort: { _id: -1 } }
        ]
      }
    }
  ]);
  
  // Calculate matches and available filters
  const page = Number(req.query.page) || 1;
  const totalPages = Math.ceil(totalProducts / limit);
  
  // Format filters for response
  const filters = {
    brands: aggregateFilters[0].brands.map(b => b._id).filter(Boolean),
    priceRange: aggregateFilters[0].priceRange[0] || { min: 0, max: 0 },
    ratings: aggregateFilters[0].ratings.map(r => r._id).filter(Boolean)
  };
  
  res.json({
    products,
    page,
    pages: totalPages,
    totalProducts,
    filters,
    appliedFilters: stats.appliedFilters,
    sortBy: stats.sortBy
  });
});

// @desc    Get product suggestions (autocomplete)
// @route   GET /api/search/suggestions
// @access  Public
const getProductSuggestions = asyncHandler(async (req, res) => {
  const { q, limit = 5 } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }
  
  // Find matching products
  const products = await Product.find({
    name: { $regex: q, $options: 'i' },
    isActive: true
  })
    .select('name slug')
    .limit(Number(limit));
  
  // Find matching categories
  const categories = await Category.find({
    name: { $regex: q, $options: 'i' },
    isActive: true
  })
    .select('name slug')
    .limit(Number(limit));
  
  // Construct suggestions
  const suggestions = {
    products: products.map(p => ({ 
      type: 'product',
      name: p.name, 
      slug: p.slug 
    })),
    categories: categories.map(c => ({ 
      type: 'category',
      name: c.name, 
      slug: c.slug 
    }))
  };
  
  res.json(suggestions);
});

// @desc    Get trending searches
// @route   GET /api/search/trending
// @access  Public
const getTrendingSearches = asyncHandler(async (req, res) => {
  // In a real application, this would come from a database of tracked searches
  // For now, we'll return static data
  
  const trendingSearches = [
    { term: 'smartphone', count: 120 },
    { term: 'laptop', count: 98 },
    { term: 'headphones', count: 85 },
    { term: 'smartwatch', count: 72 },
    { term: 'bluetooth speaker', count: 65 }
  ];
  
  res.json({ trending: trendingSearches });
});

module.exports = {
  searchProducts,
  getProductSuggestions,
  getTrendingSearches
};