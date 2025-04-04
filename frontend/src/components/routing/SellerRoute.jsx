import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Route protection for seller and admin roles
const SellerRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Allow both sellers and admins to access seller routes
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default SellerRoute;