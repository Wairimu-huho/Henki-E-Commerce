// src/services/api.js
import axios from 'axios';

// Create an Axios instance with custom configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,  // Increased timeout
  // Add CORS settings
  validateStatus: function (status) {
    return status >= 200 && status < 300; // Accept only success status codes
  }
});

// Add a request interceptor to attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (expired tokens, etc.)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // You could also dispatch an action to clear the user from state
      // or redirect to the login page
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server might be slow or unreachable');
    }
    return Promise.reject(error);
  }
);

// API service methods
const ApiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => API.post('/api/auth/login', credentials),
    register: (userData) => API.post('/api/auth/register', userData),
    getProfile: () => API.get('/api/auth/profile'),
    updateProfile: (data) => API.put('/api/user/profile', data),
  },
  
  // Products endpoints
  products: {
    getAll: (params) => API.get('/api/products', { params }),
    getById: (id) => API.get(`/api/products/${id}`),
    getFeatured: () => API.get('/api/products/featured'),
    getByCategory: (category) => API.get(`/api/products/category/${category}`),
    search: (query) => API.get('/api/products/search', { params: { q: query } }),
  },
  
  // Seller products
  seller: {
    getProducts: (params) => API.get('/api/seller/products', { params }),
    getProduct: (id) => API.get(`/api/seller/products/${id}`),
    createProduct: (data) => API.post('/api/seller/products', data),
    updateProduct: (id, data) => API.put(`/api/seller/products/${id}`, data),
    deleteProduct: (id) => API.delete(`/api/seller/products/${id}`),
    updateProductStatus: (id, isActive) => 
      API.patch(`/api/seller/products/${id}/status`, { isActive }),
    bulkDeleteProducts: (productIds) => 
      API.delete('/api/seller/products/bulk', { data: { productIds } }),
  },
  
  // Categories
  categories: {
    getAll: () => API.get('/api/categories'),
    getById: (id) => API.get(`/api/categories/${id}`),
  },
  
  // Reviews
  reviews: {
    getForProduct: (productId) => API.get(`/api/products/${productId}/reviews`),
    addReview: (productId, reviewData) => 
      API.post(`/api/products/${productId}/reviews`, reviewData),
    updateReview: (productId, reviewId, reviewData) => 
      API.put(`/api/products/${productId}/reviews/${reviewId}`, reviewData),
  },
  
  // Cart
  cart: {
    getCart: () => API.get('/api/cart'),
    addToCart: (productId, quantity) => 
      API.post('/api/cart', { productId, quantity }),
    updateQuantity: (productId, quantity) => 
      API.put(`/api/cart/${productId}`, { quantity }),
    removeFromCart: (productId) => API.delete(`/api/cart/${productId}`),
    clearCart: () => API.delete('/api/cart'),
  },

  // Orders
  orders: {
    createOrder: (orderData) => API.post('/api/orders', orderData),
    getMyOrders: () => API.get('/api/orders/my-orders'),
    getOrderDetails: (orderId) => API.get(`/api/orders/${orderId}`),
  },
  
  // File uploads
  uploads: {
    uploadProductImage: (formData) => API.post('/api/uploads/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    uploadProfilePicture: (formData) => API.post('/api/user/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  },
};

export default ApiService;