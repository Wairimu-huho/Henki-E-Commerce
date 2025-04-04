// src/pages/seller/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch dashboard stats
        const statsResponse = await axios.get('/api/seller/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Fetch recent orders
        const ordersResponse = await axios.get('/api/seller/orders?limit=5', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setStats(statsResponse.data);
        setRecentOrders(ordersResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10">Loading dashboard data...</div>;
    }

    if (error) {
      return (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
            <p className="text-3xl font-bold">{stats.totalSales}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold">{stats.totalProducts}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
            <p className="text-3xl font-bold">{stats.pendingOrders}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link to="/seller/orders" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/seller/orders/${order._id}`} className="text-primary hover:underline">
                          #{order._id.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/seller/products/add" 
              className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-gray-50"
            >
              <span className="text-4xl mb-2">+</span>
              <span className="font-medium">Add New Product</span>
            </Link>
            
            <Link 
              to="/seller/orders?status=Processing" 
              className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-gray-50"
            >
              <span className="text-4xl mb-2">📦</span>
              <span className="font-medium">Manage Orders</span>
            </Link>
            
            <Link 
              to="/seller/settings" 
              className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-gray-50"
            >
              <span className="text-4xl mb-2">⚙️</span>
              <span className="font-medium">Store Settings</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/seller/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/seller/orders' },
    { id: 'settings', label: 'Store Settings', icon: 'settings', link: '/seller/settings' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2', link: '/seller/analytics' },
  ];

  return (
    <DashboardLayout
      title="Seller Dashboard"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;