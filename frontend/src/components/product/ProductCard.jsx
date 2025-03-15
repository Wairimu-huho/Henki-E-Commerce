// src/components/product/ProductCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';

const ProductCard = ({ product, compact = false }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Handling missing image
  const imageSrc = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/300x300?text=No+Image';
  
  // Calculate discount percentage if there's a sale price
  const discountPercentage = product.price && product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    
    // Simulating a delay for better user experience
    setTimeout(() => {
      addToCart(product, 1);
      setIsAddingToCart(false);
    }, 500);
  };
  
  return (
    <Link 
      to={`/products/${product._id}`}
      className={`group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${compact ? '' : 'h-full flex flex-col'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className={`relative ${compact ? 'aspect-square' : 'aspect-[3/4]'} overflow-hidden bg-gray-100`}>
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
              New
            </span>
          )}
          
          {discountPercentage > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
          
          {product.freeShipping && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
              Free Shipping
            </span>
          )}
        </div>
        
        {/* Quick Add to Cart - Only on full card version */}
        {!compact && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-center py-2 transition-transform duration-300 ${
              isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full h-full flex items-center justify-center text-sm font-medium"
            >
              {isAddingToCart ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Quick Add
                </span>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className={`p-4 ${compact ? '' : 'flex-grow flex flex-col'}`}>
        {/* Seller Name - if we have seller info */}
        {product.seller && (
          <p className="text-xs text-gray-500 mb-1">
            {product.seller.name || 'Unknown Seller'}
          </p>
        )}
        
        {/* Product Name */}
        <h3 className={`font-medium ${compact ? 'text-sm line-clamp-1' : 'mb-1 line-clamp-2'}`}>
          {product.name}
        </h3>
        
        {/* Product Rating - if not compact */}
        {!compact && product.rating !== undefined && (
          <div className="flex items-center mt-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className={`${compact ? 'mt-1' : 'mt-auto pt-2'}`}>
          {product.salePrice ? (
            <div className="flex items-center">
              <span className="text-red-600 font-medium mr-2">
                ${product.salePrice.toFixed(2)}
              </span>
              <span className="text-gray-500 text-sm line-through">
                ${product.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="font-medium">
              ${product.price ? product.price.toFixed(2) : '0.00'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;