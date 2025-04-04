// src/components/product/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import ApiService from '../../services/api';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    _id,
    name,
    price,
    images,
    rating,
    numReviews,
    countInStock,
    discount,
  } = product;

  const discountedPrice = discount ? price - (price * discount / 100) : price;
  
  // Handle quick add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (countInStock <= 0) return;
    
    try {
      setIsAddingToCart(true);
      setError(null);
      
      // Using the ApiService for cart operations
      await ApiService.cart.addToCart(_id, 1);
      
      // Update local cart context
      addToCart(product, 1);
      
      // You could add a toast notification or other feedback here
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('Failed to add to cart');
      
      // You could show an error toast here
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Calculate star rating display
  const renderStarRating = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push(
        <svg key="half" className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#half-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {discount}% OFF
        </div>
      )}
      
      {countInStock === 0 && (
        <div className="absolute top-2 right-2 z-10 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">
          Out of Stock
        </div>
      )}
      
      <Link to={`/products/${_id}`} className="block">
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={images?.[0] || '/placeholder-product.png'}
            alt={name}
            className="h-full w-full object-cover object-center"
          />
          
          {/* Quick action buttons on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
            {countInStock > 0 && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="bg-white text-gray-900 px-4 py-2 rounded-full shadow-md hover:bg-primary hover:text-white transition-colors disabled:opacity-70"
              >
                {isAddingToCart ? 'Adding...' : 'Quick Add'}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
          
          <div className="mt-1 flex items-center">
            <div className="flex items-center">
              {renderStarRating()}
            </div>
            <span className="ml-2 text-xs text-gray-500">({numReviews})</span>
          </div>
          
          <div className="mt-2 flex justify-between items-center">
            <div>
              {discount > 0 ? (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">${discountedPrice.toFixed(2)}</span>
                  <span className="ml-2 text-xs text-gray-500 line-through">${price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900">${price.toFixed(2)}</span>
              )}
            </div>
            
            {error && <div className="text-xs text-red-500">{error}</div>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;