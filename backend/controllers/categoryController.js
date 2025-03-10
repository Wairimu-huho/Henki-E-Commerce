const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent } = req.body;

  // Check if parent category exists if provided
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(400);
      throw new Error('Parent category not found');
    }
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({
    name,
    description,
    image,
    parent
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error('Invalid category data');
  }
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  // Only get active categories by default
  const showAll = req.query.showAll === 'true' && req.user?.role === 'admin';
  const query = showAll ? {} : { isActive: true };
  
  const categories = await Category.find(query)
    .populate({
      path: 'parent',
      select: 'name slug'
    });

  res.json(categories);
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({
      path: 'parent',
      select: 'name slug'
    })
    .populate({
      path: 'children',
      select: 'name slug description image'
    });

  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate({
      path: 'parent',
      select: 'name slug'
    })
    .populate({
      path: 'children',
      select: 'name slug description image'
    });

  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent, isActive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if parent category exists if provided
  if (parent) {
    // Make sure parent is not self
    if (parent === req.params.id) {
      res.status(400);
      throw new Error('Category cannot be its own parent');
    }
    
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(400);
      throw new Error('Parent category not found');
    }
    
    // Check for circular reference
    let currentParent = parent;
    while (currentParent) {
      if (currentParent === req.params.id) {
        res.status(400);
        throw new Error('Circular reference detected in category hierarchy');
      }
      
      const parent = await Category.findById(currentParent);
      currentParent = parent ? parent.parent : null;
    }
  }

  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }
  }

  category.name = name || category.name;
  category.description = description !== undefined ? description : category.description;
  category.image = image !== undefined ? image : category.image;
  category.parent = parent !== undefined ? parent : category.parent;
  category.isActive = isActive !== undefined ? isActive : category.isActive;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if category has children
  const childCategories = await Category.find({ parent: req.params.id });
  if (childCategories.length > 0) {
    res.status(400);
    throw new Error('Cannot delete category with child categories');
  }

  // Check if category has products
  const productsWithCategory = await Product.find({ category: req.params.id });
  if (productsWithCategory.length > 0) {
    res.status(400);
    throw new Error('Cannot delete category with associated products');
  }

  await category.deleteOne();
  res.json({ message: 'Category removed' });
});

// @desc    Get category hierarchy
// @route   GET /api/categories/hierarchy
// @access  Public
const getCategoryHierarchy = asyncHandler(async (req, res) => {
  // Only get active categories by default
  const showAll = req.query.showAll === 'true' && req.user?.role === 'admin';
  const query = showAll ? {} : { isActive: true };
  
  // Get all categories
  const allCategories = await Category.find(query)
    .populate({
      path: 'parent',
      select: 'name slug'
    });
  
  // Organize into hierarchy
  const rootCategories = [];
  const categoriesMap = {};
  
  // First pass: Map all categories by ID
  allCategories.forEach(category => {
    categoriesMap[category._id] = {
      ...category.toObject(),
      children: []
    };
  });
  
  // Second pass: Build tree structure
  allCategories.forEach(category => {
    if (category.parent) {
      const parentId = category.parent._id;
      if (categoriesMap[parentId]) {
        categoriesMap[parentId].children.push(categoriesMap[category._id]);
      }
    } else {
      rootCategories.push(categoriesMap[category._id]);
    }
  });
  
  res.json(rootCategories);
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy
};