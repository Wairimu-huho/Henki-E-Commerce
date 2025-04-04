// src/pages/seller/EditProduct.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProductForm from '../../components/seller/ProductForm';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.success || '');
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product details
        const token = localStorage.getItem('token');
        const productResponse = await axios.get(`/api/seller/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Fetch categories
        const categoriesResponse = await axios.get('/api/categories');
        
        setProduct(productResponse.data);
        setCategories(categoriesResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch product details');
        setLoading(false);
      }
    };

    fetchData();
    
    // Clear the success message after 5 seconds
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [id, success]);

  const handleSubmit = async (productData) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append text fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'existingImages' && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });
      
      // Append existing images (that weren't deleted)
      if (productData.existingImages && productData.existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(productData.existingImages));
      }
      
      // Append new image files
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(image => {
          if (image instanceof File) {
            formData.append('newImages', image);
          }
        });
      }
      
      await axios.put(
        `/api/seller/products/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setSuccess('Product updated successfully!');
      
      // Refresh product data
      const { data } = await axios.get(`/api/seller/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setProduct(data);
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update product'
      };
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/seller/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        navigate('/seller/products', { 
          state: { success: 'Product deleted successfully!' } 
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
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
      title="Edit Product"
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
          
          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
              {success}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            {product ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Edit Product</h2>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Product
                  </button>
                </div>
                
                <ProductForm 
                  initialData={product}
                  categories={categories}
                  onSubmit={handleSubmit}
                  onCancel={() => navigate('/seller/products')}
                  isEdit={true}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Product not found</p>
                <button
                  onClick={() => navigate('/seller/products')}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Back to Products
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default EditProduct;