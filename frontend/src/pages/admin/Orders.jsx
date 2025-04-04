import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid', link: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: 'users', link: '/admin/users' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/admin/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/admin/orders' },
    { id: 'settings', label: 'Site Settings', icon: 'settings', link: '/admin/settings' },
  ];

  return (
    <DashboardLayout
      title="Order Management"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Order Management</h2>
        <p className="text-gray-600">This feature is coming soon.</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders; 