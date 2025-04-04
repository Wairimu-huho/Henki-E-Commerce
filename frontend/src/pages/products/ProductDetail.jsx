// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import ProductReviews from '../../components/product/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
        
        // Reset quantity and selected image when product changes
        setQuantity(1);
        setSelectedImage(0);
        
        // Fetch related products
        if (data.category) {
          const relatedResponse = await axios.get(`/api/products?category=${data.category}&limit=4&exclude=${data._id}`);
          setRelatedProducts(relatedResponse.data.products);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch product details');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(Math.max(1, Math.min(value, product.countInStock)));
  };

  const increaseQuantity = () => {
    if (quantity < product.countInStock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    // Optional: Show a notification or redirect to cart
  };

  // Calculate discounted price if applicable
  const getPrice = () => {
    if (!product) return null;
    
    if (product.discount) {
      const discountedPrice = product.price - (product.price * product.discount / 100);
      return (
        <div className="flex items-center">
          <span className="text-2xl font-bold text-gray-900">${discountedPrice.toFixed(2)}</span>
          <span className="ml-2 text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
            {product.discount}% OFF
          </span>
        </div>
      );
    }
    
    return <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error || 'Product not found'}
        </div>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex text-sm">
          <li className="mr-2">
            <Link to="/" className="text-gray-500 hover:text-primary">Home</Link>
          </li>
          <li className="mx-2 text-gray-500">/</li>
          <li className="mr-2">
            <Link to="/products" className="text-gray-500 hover:text-primary">Products</Link>
          </li>
          <li className="mx-2 text-gray-500">/</li>
          <li className="text-primary">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
            <img
              src={product.images?.[selectedImage] || '/placeholder-product.png'}
              alt={product.name}
              className="w-full h-96 object-contain"
            />
          </div>
          
          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`border rounded-md overflow-hidden ${
                    selectedImage === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} - view ${index + 1}`} 
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {/* Ratings */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(product.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-gray-600">
              {product.rating.toFixed(1)} ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          
          {/* Price */}
          <div className="mb-6">
            {getPrice()}
          </div>
          
          {/* Stock Status */}
          <div className="mb-6">
            <span className={`px-3 py-1 ${
              product.countInStock > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              } text-sm font-medium rounded-full`}
            >
              {product.countInStock > 0 
                ? `In Stock (${product.countInStock} available)` 
                : 'Out of Stock'}
            </span>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          {/* Quantity */}
          {product.countInStock > 0 && (
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-l-md hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max={product.countInStock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 text-center border-t border-b border-gray-300 py-2"
                />
                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-r-md hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Add to Cart Button */}
          <div className="mb-6">
            <button
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
              className={`w-full py-3 px-4 rounded-md shadow-sm font-medium text-white ${
                product.countInStock === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                <p className="mt-1">{product.brand}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1">{product.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">SKU</h3>
                <p className="mt-1">{product.sku || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Seller</h3>
                <p className="mt-1">{product.seller?.name || 'Official Store'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10">
        <ProductReviews productId={id} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Link to={`/products/${relatedProduct._id}`}>
                  <div className="h-48 w-full rounded-t-lg overflow-hidden">
                    <img
                      src={relatedProduct.images?.[0] || '/placeholder-product.png'}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{relatedProduct.name}</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">${relatedProduct.price.toFixed(2)}</p>
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