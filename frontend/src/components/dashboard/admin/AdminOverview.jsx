import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch dashboard stats
        const statsResponse = await axios.get('/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Fetch recent orders
        const ordersResponse = await axios.get('/api/admin/orders?limit=5', {
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

  if (loading) return <div className="text-center py-10">Loading dashboard data...</div>;

  if (error) return (
    <div className="bg-red-100 text-red-700 p-4 rounded-md">
      {error}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <div className="mt-1 flex items-center">
            <span className="text-sm text-gray-500">
              {stats.totalSellers} Sellers
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <div className="mt-1 flex items-center">
            <span className="text-sm text-gray-500">
              ${stats.totalRevenue.toFixed(2)} Revenue
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/admin/orders/${order._id}`} className="text-primary hover:underline">
                          #{order._id.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.totalPrice.toFixed(2)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Link 
              to="/admin/users" 
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50"
            >
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-500">View and manage user accounts</p>
              </div>
            </Link>
            
            <Link 
              to="/admin/products" 
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50"
            >
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h3 className="font-medium">Manage Products</h3>
                <p className="text-sm text-gray-500">Oversee all products in the marketplace</p>
              </div>
            </Link>
            
            <Link 
              to="/admin/categories" 
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50"
            >
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <span className="text-xl">📁</span>
              </div>
              <div>
                <h3 className="font-medium">Manage Categories</h3>
                <p className="text-sm text-gray-500">Organize product categories</p>
              </div>
            </Link>
            
            <Link 
              to="/admin/settings" 
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50"
            >
              <div className="p-3 rounded-full bg-gray-100 text-gray-500 mr-4">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="font-medium">System Settings</h3>
                <p className="text-sm text-gray-500">Configure platform settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;