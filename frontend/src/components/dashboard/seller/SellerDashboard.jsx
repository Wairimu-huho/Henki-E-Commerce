import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import SellerOverview from './SellerOverview';
import ProductManagement from './ProductManagement';
import OrderManagement from './seller/OrderManagement';
import StoreSettings from './seller/StoreSettings';
import SellerAnalytics from './seller/SellerAnalytics';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  if (!user) return <div>Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SellerOverview />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'settings':
        return <StoreSettings seller={user} />;
      case 'analytics':
        return <SellerAnalytics />;
      default:
        return <SellerOverview />;
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid' },
    { id: 'products', label: 'Product Management', icon: 'package' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart' },
    { id: 'settings', label: 'Store Settings', icon: 'settings' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
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

export default SellerDashboard;