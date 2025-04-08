// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import AuthProvider from './context/AuthContext';
import CartProvider from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import SellerRoute from './components/common/SellerRoute';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const Cart = lazy(() => import('./pages/orders/Cart'));
const Checkout = lazy(() => import('./pages/orders/Checkout'));

// Customer pages
const Profile = lazy(() => import('./pages/Profile'));
const OrderHistory = lazy(() => import('./pages/orders/OrderHistory'));
const OrderDetail = lazy(() => import('./pages/orders/OrderDetail'));

// Seller pages
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'));
const SellerProducts = lazy(() => import('./pages/seller/Products'));
const AddSellerProduct = lazy(() => import('./pages/seller/AddProduct'));
const EditSellerProduct = lazy(() => import('./pages/seller/EditProduct'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminAddProduct = lazy(() => import('./pages/admin/AddProduct'));
const AdminEditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Loading component for suspense fallback
const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/add" element={<AdminAddProduct />} />
                <Route path="/admin/products/edit/:id" element={<AdminEditProduct />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
              
              {/* Seller Routes */}
              <Route element={<SellerRoute />}>
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/seller/products" element={<SellerProducts />} />
                <Route path="/seller/products/add" element={<AddSellerProduct />} />
                <Route path="/seller/products/edit/:id" element={<EditSellerProduct />} />
              </Route>
              
              {/* Routes with Layout */}
              <Route element={<Layout />}>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                
                {/* Customer Routes (require login) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                </Route>
              </Route>
              
              {/* 404 Not Found */}
              <Route path="*" element={
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="mb-8">The page you are looking for doesn't exist.</p>
                  <a href="/" className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark">
                    Go Home
                  </a>
                </div>
              } />
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;