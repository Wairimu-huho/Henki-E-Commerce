import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('settings');

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid', link: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: 'users', link: '/admin/users' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/admin/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/admin/orders' },
    { id: 'settings', label: 'Site Settings', icon: 'settings', link: '/admin/settings' },
  ];

  return (
    <DashboardLayout
      title="Site Settings"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
        <p className="text-gray-600">This feature is coming soon.</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings; 