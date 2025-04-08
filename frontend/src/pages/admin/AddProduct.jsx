// src/pages/admin/AddProduct.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProductForm from '../../components/admin/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch categories');
      setLoading(false);
    }
  };

  const handleSubmit = async (productData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Step 1: Create the product
      const formattedData = {
        name: productData.name,
        brand: productData.brand || 'Generic Brand',
        category: productData.category || null,
        description: productData.description || '',
        price: parseFloat(productData.price) || 0,
        countInStock: parseInt(productData.countInStock) || 0,
        image: 'https://via.placeholder.com/300', // Placeholder for now
        featured: Boolean(productData.featured),
        isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true
      };
      
      // Create the product
      const response = await axios.post(
        '/api/admin/products',
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const newProduct = response.data;
      
      // Step 2: If we have actual image files, upload them
      if (productData.images && productData.images.length > 0) {
        try {
          // Get the new product ID from the response
          const productId = newProduct._id;
          
          // Create a FormData object for the image upload
          const imageFormData = new FormData();
          imageFormData.append('image', productData.images[0]); // Upload the first image
          
          // Upload the image with extended timeout
          await axios.post(
            `/api/admin/products/${productId}/upload-image`,
            imageFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
              },
              timeout: 60000, // Increase timeout to 60 seconds
            }
          );
          
          console.log('Image uploaded successfully');
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Don't fail the whole process, just show a warning
          setError('Product created, but image upload failed. You can upload images later.');
          // Continue with navigation despite image upload failure
        }
      }
      
      // Redirect to product list
      navigate('/admin/products', { 
        state: { success: 'Product created successfully!' } 
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error creating product:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create product';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };
  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'grid', link: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: 'users', link: '/admin/users' },
    { id: 'products', label: 'Product Management', icon: 'package', link: '/admin/products' },
    { id: 'orders', label: 'Order Management', icon: 'shopping-cart', link: '/admin/orders' },
    { id: 'settings', label: 'Site Settings', icon: 'settings', link: '/admin/settings' },
  ];

  return (
    <DashboardLayout
      title="Add New Product"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {loading && !categories.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Add New Product</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <ProductForm 
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/products')}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AddProduct;