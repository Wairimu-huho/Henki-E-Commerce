// src/components/common/SellerRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SellerRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return user && (user.role === 'seller' || user.role === 'admin') ? <Outlet /> : <Navigate to="/login" replace />;
};

export default SellerRoute;