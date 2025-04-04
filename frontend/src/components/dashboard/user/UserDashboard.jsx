import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import ProfileInfo from './ProfileInfo';
import OrderHistory from './OrderHistory';
import Addresses from './Addresses';
import Wishlist from './user/Wishlist';
import Reviews from './user/Reviews';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  
  if (!user) return <div>Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInfo user={user} />;
      case 'orders':
        return <OrderHistory />;
      case 'addresses':
        return <Addresses />;
      case 'wishlist':
        return <Wishlist />;
      case 'reviews':
        return <Reviews />;
      default:
        return <ProfileInfo user={user} />;
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Profile Information', icon: 'user' },
    { id: 'orders', label: 'Order History', icon: 'shopping-bag' },
    { id: 'addresses', label: 'My Addresses', icon: 'map-pin' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { id: 'reviews', label: 'My Reviews', icon: 'star' },
  ];

  return (
    <DashboardLayout
      title="My Account"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default UserDashboard;