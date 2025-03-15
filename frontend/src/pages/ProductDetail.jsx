// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import useCart from '../hooks/useCart';
import Button from '../components/common/Button';
import ProductReviews from '../components/product/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
        setSelectedImage(0); // Reset selected image when product changes
        
        // Fetch related products from same category
        if (data.category) {
          const relatedData = await productService.getProductsByCategory(data.category._id);
          // Filter out current product and limit to 4 products
          setRelatedProducts(
            relatedData.products
              .filter(p => p._id !== data._id)
              .slice(0, 4)
          );
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.countInStock || 10)) {
      setQuantity(value);
    }
  };
  
  const incrementQuantity = () => {
    if (quantity < (product?.countInStock || 10)) {
      setQuantity(quantity + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    setTimeout(() => {
      addToCart(product, quantity);
      setIsAddingToCart(false);
    }, 500);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-xl font-medium text-gray-900 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-xl font-medium text-gray-900 mb-4">Product not found</p>
          <Button variant="outline" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }
  
  // Format a display date from ISO string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate discount percentage if there's a sale price
  const discountPercentage = product.price && product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex text-gray-500 text-sm">
          <li>
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/products" className="hover:text-blue-600">Products</Link>
            <span className="mx-2">/</span>
          </li>
          {product.category && (
            <li>
              <Link 
                to={`/products?category=${product.category._id}`} 
                className="hover:text-blue-600"
              >
                {product.category.name}
              </Link>
              <span className="mx-2">/</span>
            </li>
          )}
          <li className="text-gray-700 font-medium truncate">
            {product.name}
          </li>
        </ol>
      </nav>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="mb-4 aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                  No image available
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded border-2 overflow-hidden ${
                      selectedImage === index
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-col h-full">
              {/* Product Header */}
              <div>
                <div className="flex justify-between items-start">
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  
                  {/* Wishlist Button */}
                  <button className="p-2 text-gray-400 hover:text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>
                </div>
                
                {/* Product Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                  {product.brand && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Brand:</span> {product.brand}
                    </div>
                  )}
                  
                  {product.sku && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">SKU:</span> {product.sku}
                    </div>
                  )}
                  
                  {product.createdAt && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Listed:</span> {formatDate(product.createdAt)}
                    </div>
                  )}
                </div>
                
                {/* Seller Info */}
                {product.seller && (
                  <div className="mt-2 flex items-center text-sm">
                    <span className="mr-1">Sold by:</span>
                    <Link 
                      to={`/seller/${product.seller._id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {product.seller.name || 'Unknown Seller'}
                    </Link>
                  </div>
                )}
                
                {/* Product Rating */}
                {product.rating !== undefined && (
                  <div className="flex items-center mt-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
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
                    <span className="ml-2 text-gray-600">
                      {product.rating.toFixed(1)} ({product.reviewCount || 0} reviews)
                    </span>
                    <a href="#reviews" className="ml-4 text-sm text-blue-600 hover:underline">
                      View all reviews
                    </a>
                  </div>
                )}
              </div>
              
              {/* Product Price */}
              <div className="mt-6">
                {discountPercentage > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.salePrice.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="bg-red-100 text-red-700 text-sm font-medium px-2 py-0.5 rounded">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                
                {/* Stock Status */}
                <div className="mt-2">
                  {product.countInStock > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      In Stock ({product.countInStock} available)
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                      </svg>
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              
              {/* Product Description */}
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-2">Description</h2>
                <div className="text-gray-700 leading-relaxed">
                  {product.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description available.</p>
                  )}
                </div>
              </div>
              
              {/* Add to Cart Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center">
                    <label htmlFor="quantity" className="mr-2 text-gray-700">
                      Quantity:
                    </label>
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        type="button"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                        </svg>
                      </button>
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={product.countInStock || 10}
                        className="w-12 h-10 text-center border-x border-gray-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={incrementQuantity}
                        disabled={quantity >= (product.countInStock || 10)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button
                    variant="primary"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.countInStock <= 0}
                    className="flex-grow sm:flex-grow-0 sm:w-48"
                  >
                    {isAddingToCart ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        {product.countInStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </span>
                    )}
                  </Button>
                  
                  {/* Buy Now Button */}
                  <Button
                    variant="secondary"
                    disabled={product.countInStock <= 0}
                    onClick={() => {
                      addToCart(product, quantity);
                      navigate('/checkout');
                    }}
                    className="flex-grow sm:flex-grow-0 sm:w-48"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Buy Now
                    </span>
                  </Button>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-8 space-y-4 text-sm text-gray-600">
                {product.freeShipping && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Free shipping on this item
                  </div>
                )}
                
                {product.returnable && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    30-day easy returns
                  </div>
                )}
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  Secure shopping
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Specs and Details */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium text-gray-700 min-w-[150px]">{key}:</span>
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews Section */}
      <div id="reviews" className="mt-8">
        <ProductReviews productId={id} />
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Related Products</h2>
            <Link 
              to={product.category ? `/products?category=${product.category._id}` : '/products'} 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View More
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* This would loop through related products, assuming we have a ProductCard component */}
            {relatedProducts.map((relatedProduct) => (
              // Replace with your actual ProductCard component
              <div key={relatedProduct._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Link to={`/products/${relatedProduct._id}`}>
                  <div className="aspect-square bg-gray-100 relative">
                    {relatedProduct.images && relatedProduct.images.length > 0 ? (
                      <img 
                        src={relatedProduct.images[0]} 
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{relatedProduct.name}</h3>
                    <p className="text-gray-600">${relatedProduct.price.toFixed(2)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;