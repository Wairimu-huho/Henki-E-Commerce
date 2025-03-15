// src/services/orderService.js
import api from './api';

const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create order');
    }
  },

  // Get user's orders
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/myorders');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch orders');
    }
  },

  // Get order by ID
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch order');
    }
  },

  // Update order to paid
  updateOrderToPaid: async (orderId, paymentResult) => {
    try {
      const response = await api.put(`/orders/${orderId}/pay`, paymentResult);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update payment status');
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to cancel order');
    }
  },

  // Admin: Get all orders
  getAllOrders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add params to query string
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await api.get(`/orders?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch all orders');
    }
  },

  // Admin: Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update order status');
    }
  },

  // Admin: Mark order as delivered
  updateOrderToDelivered: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/deliver`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to mark order as delivered');
    }
  }
};

export default orderService;