// src/pages/seller/AddProduct.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProductForm from '../../components/seller/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/categories');
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch categories');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (productData) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append text fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });
      
      // Append images
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const { data } = await axios.post(
        '/api/seller/products',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Redirect to product edit page or product list
      navigate(`/seller/products/edit/${data._id}`, { 
        state: { success: 'Product created successfully!' } 
      });
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to create product'
      };
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid', link: '/seller/dashboard' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/seller/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/seller/orders' },
    { id: 'settings', label: 'Store Settings', icon: 'settings', link: '/seller/settings' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2', link: '/seller/analytics' },
  ];

  return (
    <DashboardLayout
      title="Add New Product"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProductForm 
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/seller/products')}
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AddProduct;