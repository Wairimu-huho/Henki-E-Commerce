// src/services/productService.js
import api from './api';
import ApiService from './api';
import axios from 'axios';

// Set a timeout for API requests
axios.defaults.timeout = 10000; // 10 seconds

const productService = {
  // Get all products with optional filtering
  getProducts: async (filters = {}) => {
    try {
      const response = await ApiService.products.getAll(filters);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error.response?.data || new Error('Failed to fetch products');
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await ApiService.products.getById(id);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch product');
    }
  },

  // Get product by slug
  getProductBySlug: async (slug) => {
    try {
      const response = await ApiService.products.getBySlug(slug);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch product');
    }
  },

  // Get top products
  getTopProducts: async () => {
    try {
      const response = await ApiService.products.getTop();
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch top products');
    }
  },

  // Get featured products
  getFeaturedProducts: async () => {
    try {
      const response = await axios.get('/api/products?featured=true&limit=4');
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  // Get sale products
  getSaleProducts: async () => {
    try {
      const response = await ApiService.products.getSale();
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch sale products');
    }
  },

  // Get related products
  getRelatedProducts: async (productId) => {
    try {
      const response = await ApiService.products.getRelated(productId);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch related products');
    }
  },

  // Create product review
  createProductReview: async (productId, reviewData) => {
    try {
      const response = await ApiService.products.createReview(productId, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to create review');
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await axios.get('/api/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await ApiService.categories.getById(id);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch category');
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    try {
      const response = await ApiService.categories.getBySlug(slug);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch category');
    }
  },

  // Get category hierarchy
  getCategoryHierarchy: async () => {
    try {
      const response = await ApiService.categories.getHierarchy();
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch category hierarchy');
    }
  },

  // Search products
  searchProducts: async (query) => {
    try {
      const response = await ApiService.products.search(query);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to search products');
    }
  },

  // Get product reviews
  getProductReviews: async (productId) => {
    try {
      const response = await ApiService.products.getReviews(productId);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch product reviews');
    }
  },

  // Admin: Create a new product
  createProduct: async (productData) => {
    try {
      const response = await ApiService.products.create(productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create product');
    }
  },

  // Admin: Update a product
  updateProduct: async (id, productData) => {
    try {
      const response = await ApiService.products.update(id, productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update product');
    }
  },

  // Admin: Delete a product
  deleteProduct: async (id) => {
    try {
      const response = await ApiService.products.delete(id);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete product');
    }
  },

  // Get products with pagination and filters
  getProducts: async (params = {}) => {
    try {
      const response = await axios.get('/api/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], totalPages: 1 };
    }
  }
};

export default productService;