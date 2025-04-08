// routes/adminProductRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
const { productImageUpload } = require('../middleware/uploadMiddleware');
const { uploadImage, deleteImage } = require('../utils/cloudinaryConfig');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Admin: Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
router.get('/products', protect, admin, async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const keyword = req.query.search
      ? {
          name: {
            $regex: req.query.search,
            $options: 'i',
          },
        }
      : {};
    
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .populate('category', 'name')
      .populate('user', 'name')
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
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @desc    Admin: Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post('/products', protect, admin, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      countInStock,
      image,
      featured,
      isActive
    } = req.body;

    // Generate slug from name
    const slug = slugify(name, { lower: true });

    // Check if product with slug already exists
    const productExists = await Product.findOne({ slug });
    if (productExists) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    // Check if category exists
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    // Create product
    const product = await Product.create({
      user: req.user._id, // Admin user ID
      name,
      slug,
      brand: brand || '',
      category: category || null,
      description: description || '',
      price: price || 0,
      countInStock: countInStock || 0,
      image: image || '',
      featured: featured || false,
      isActive: isActive !== undefined ? isActive : true
    });

    if (product) {
      res.status(201).json(product);
    } else {
      res.status(400).json({ message: 'Invalid product data' });
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// @desc    Admin: Get a product by ID
// @route   GET /api/admin/products/:id
// @access  Private/Admin
router.get('/products/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('user', 'name');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @desc    Admin: Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put('/products/:id', protect, admin, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      countInStock,
      image,
      featured,
      isActive
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if changing name and if new slug would conflict
    if (name && name !== product.name) {
      const newSlug = slugify(name, { lower: true });
      const existingProduct = await Product.findOne({ slug: newSlug });
      
      if (existingProduct && existingProduct._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Product with this name already exists' });
      }
      
      product.slug = newSlug;
    }

    // Update fields
    product.name = name || product.name;
    product.brand = brand || product.brand;
    
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found' });
      }
      product.category = category;
    }
    
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.image = image || product.image;
    product.featured = featured !== undefined ? featured : product.featured;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @desc    Admin: Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete('/products/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({
      message: 'Error removing product',
      error: error.message
    });
  }
});

// @desc    Admin: Upload product image
// @route   POST /api/admin/products/:id/upload-image
// @access  Private/Admin
router.post(
  '/products/:id/upload-image',
  protect,
  admin,
  productImageUpload.single('image'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image file' });
      }

      // Upload to cloudinary
      const result = await uploadImage(req.file.path, 'ecommerce-products');
      
      // If product already has an image, delete the old one
      if (product.image && product.image.includes('cloudinary')) {
        // Extract public_id from the URL
        const publicId = product.image
          .split('/')
          .slice(-1)[0]
          .split('.')[0];
          
        if (publicId) {
          await deleteImage(`ecommerce-products/${publicId}`);
        }
      }

      // Update product image
      product.image = result.secure_url;
      await product.save();
      
      // Delete file from server after upload
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Product image uploaded successfully',
        image: product.image
      });
    } catch (error) {
      // Delete file from server if there was an error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        message: `Image upload failed: ${error.message}`,
        error: error.toString()
      });
    }
  }
);

module.exports = router;