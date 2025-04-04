import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import CategoryManagement from './admin/CategoryManagement';
import SystemSettings from './admin/SystemSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  if (!user) return <div>Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      case 'products':
        return <AdminProducts />;
      case 'orders':
        return <AdminOrders />;
      case 'categories':
        return <CategoryManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminOverview />;
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid' },
    { id: 'users', label: 'User Management', icon: 'users' },
    { id: 'products', label: 'Product Management', icon: 'package' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart' },
    { id: 'categories', label: 'Categories', icon: 'folder' },
    { id: 'settings', label: 'System Settings', icon: 'settings' },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
