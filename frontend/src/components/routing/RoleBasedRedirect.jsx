import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component to redirect users to their appropriate dashboard based on role
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'seller':
          navigate('/seller/dashboard');
          break;
        default:
          navigate('/user/dashboard');
          break;
      }
    }
  }, [user, loading, navigate]);

  return <div className="text-center py-10">Redirecting to your dashboard...</div>;
};

export default RoleBasedRedirect;