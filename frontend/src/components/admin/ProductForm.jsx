// src/components/admin/ProductForm.jsx
import React, { useState, useRef } from 'react';
import Button from '../common/Button';

const ProductForm = ({ 
  initialData = {}, 
  categories = [], 
  onSubmit, 
  onCancel,
  isEdit = false
}) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    price: initialData.price || '',
    description: initialData.description || '',
    category: initialData.category || '',
    brand: initialData.brand || '',
    countInStock: initialData.countInStock || 0,
    images: [],
    existingImages: initialData.images || [],
    sku: initialData.sku || '',
    discount: initialData.discount || 0,
    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
    featured: initialData.featured || false
  });
  const [previewImages, setPreviewImages] = useState(initialData.images || []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to a maximum of 5 images total
    const remainingSlots = 5 - (formData.existingImages?.length || 0);
    const newFiles = files.slice(0, remainingSlots);
    
    // Create preview URLs for new images
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData({
      ...formData,
      images: [...formData.images, ...newFiles],
    });
    
    setPreviewImages([...previewImages, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index, isExisting = false) => {
    if (isExisting) {
      // Remove from existing images
      const updatedExistingImages = [...formData.existingImages];
      updatedExistingImages.splice(index, 1);
      
      // Update preview images
      const updatedPreviews = [...previewImages];
      updatedPreviews.splice(index, 1);
      
      setFormData({
        ...formData,
        existingImages: updatedExistingImages,
      });
      
      setPreviewImages(updatedPreviews);
    } else {
      // Calculate the index for new images
      const newIndex = index - (formData.existingImages?.length || 0);
      
      // Remove from new images
      const updatedImages = [...formData.images];
      const removedFile = updatedImages.splice(newIndex, 1)[0];
      
      // Remove from preview images
      const updatedPreviews = [...previewImages];
      updatedPreviews.splice(index, 1);
      
      // Revoke object URL to prevent memory leak
      if (typeof removedFile === 'object' && removedFile !== null) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      setFormData({
        ...formData,
        images: updatedImages,
      });
      
      setPreviewImages(updatedPreviews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.name || !formData.price || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        countInStock: parseInt(formData.countInStock),
        discount: parseFloat(formData.discount),
      });
      
      if (result && !result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              min="0"
              max="100"
              step="0.01"
              value={formData.discount}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        {/* Inventory & Images */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory & Images</h3>
          
          <div className="mb-4">
            <label htmlFor="countInStock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="countInStock"
              name="countInStock"
              min="0"
              value={formData.countInStock}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (visible to customers)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                  Featured Product (display on homepage)
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-md p-6">
              <div className="flex flex-wrap gap-4 mb-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative w-24 h-24">
                    <img
                      src={image}
                      alt={`Product preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, index < (formData.existingImages?.length || 0))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                {previewImages.length < 5 && (
                  <div className="w-24 h-24 flex items-center justify-center border border-gray-300 rounded-md cursor-pointer"
                       onClick={() => fileInputRef.current.click()}>
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={previewImages.length >= 5}
              >
                {previewImages.length ? 'Add More Images' : 'Upload Images'}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Upload up to 5 images. First image will be the main product image.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Product Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows="5"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
          required
        ></textarea>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          type="button" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;