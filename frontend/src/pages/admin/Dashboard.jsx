// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/dashboard');
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalProducts: response.data.totalProducts || 0,
          totalOrders: response.data.totalOrders || 0,
          totalRevenue: response.data.totalRevenue || 0,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid', link: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: 'users', link: '/admin/users' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/admin/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/admin/orders' },
    { id: 'settings', label: 'Site Settings', icon: 'settings', link: '/admin/settings' },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-4">You don't have permission to access this page.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Users</h3>
                  <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/users" className="text-blue-600 hover:underline text-sm">
                  View all users →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Products</h3>
                  <p className="text-2xl font-semibold">{stats.totalProducts}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/products" className="text-blue-600 hover:underline text-sm">
                  Manage products →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Orders</h3>
                  <p className="text-2xl font-semibold">{stats.totalOrders}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/orders" className="text-blue-600 hover:underline text-sm">
                  View all orders →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Revenue</h3>
                  <p className="text-2xl font-semibold">${(stats.totalRevenue || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/reports" className="text-blue-600 hover:underline text-sm">
                  View reports →
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-lg mb-4">Recent Users</h3>
              <p className="text-gray-500">Loading recent users...</p>
              <div className="mt-4">
                <Link to="/admin/users" className="text-blue-600 hover:underline text-sm">
                  View all users →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
              <p className="text-gray-500">Loading recent orders...</p>
              <div className="mt-4">
                <Link to="/admin/orders" className="text-blue-600 hover:underline text-sm">
                  View all orders →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;