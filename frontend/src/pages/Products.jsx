// src/pages/Products.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/common/Button';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalProducts: 0,
  });
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    featured: searchParams.get('featured') === 'true',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get current page from URL or default to 1
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Build query parameters based on filters and pagination
        const params = {
          page,
          limit: pagination.limit,
        };
  
        // Add filters to params
        if (filters.category) params.category = filters.category;
        if (filters.search) params.search = filters.search;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.featured) params.featured = true;
  
        // Handle sorting
        switch (filters.sort) {
          case 'lowest':
            params.sort = 'price';
            break;
          case 'highest':
            params.sort = '-price';
            break;
          case 'oldest':
            params.sort = 'createdAt';
            break;
          case 'newest':
          default:
            params.sort = '-createdAt';
            break;
        }
  
        const data = await productService.getProducts(params);
        setProducts(data.products);
        setPagination({
          page: data.page,
          limit: data.limit,
          totalPages: data.totalPages,
          totalProducts: data.totalProducts,
        });
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, [page, filters, pagination.limit]);
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const applyFilters = () => {
    // Update URL with filters
    const newParams = new URLSearchParams();
    
    newParams.set('page', '1'); // Reset to first page when filters change
    
    if (filters.category) newParams.set('category', filters.category);
    if (filters.search) newParams.set('search', filters.search);
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice);
    if (filters.sort) newParams.set('sort', filters.sort);
    if (filters.featured) newParams.set('featured', 'true');
    
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      featured: false,
    });
    setSearchParams({}); // Clear all URL parameters
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar - Desktop View */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold mb-4">Filters</h2>
            
            {/* Categories Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Categories</h3>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>to</span>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Featured Products Filter */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={filters.featured}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Featured Products Only
                </label>
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Sort By</h3>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="lowest">Price: Low to High</option>
                <option value="highest">Price: High to Low</option>
              </select>
            </div>
            
            {/* Filter Buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                fullWidth
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
        {/* Main Content Area */}
        <div className="flex-grow">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            {/* Mobile Filters */}
            {showFilters && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                {/* Categories Filter */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Categories</h3>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Featured Products Filter */}
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured-mobile"
                      name="featured"
                      checked={filters.featured}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="featured-mobile" className="ml-2 block text-sm text-gray-700">
                      Featured Products Only
                    </label>
                  </div>
                </div>
                
                {/* Sort Filter */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Sort By</h3>
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="lowest">Price: Low to High</option>
                    <option value="highest">Price: High to Low</option>
                  </select>
                </div>
                
                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      applyFilters();
                      setShowFilters(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Products Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white rounded-lg shadow-sm p-4">
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-gray-600">
                Showing {products.length} of {pagination.totalProducts} products
              </p>
            </div>
            
            {/* Sort Dropdown - Desktop only */}
            <div className="hidden md:block">
              <select
                name="sort"
                value={filters.sort}
                onChange={(e) => {
                  handleFilterChange(e);
                  applyFilters();
                }}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="lowest">Price: Low to High</option>
                <option value="highest">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {/* Active Filters */}
          {(filters.category || filters.minPrice || filters.maxPrice || filters.featured || filters.search) && (
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-700 font-medium">Active Filters:</span>
                
                {filters.category && categories.length > 0 && (
                  <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span className="mr-1">Category: </span>
                    <span className="font-medium">
                      {categories.find((cat) => cat._id === filters.category)?.name || 'Unknown'}
                    </span>
                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, category: '' }));
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('category');
                        setSearchParams(newParams);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span className="mr-1">Price: </span>
                    <span className="font-medium">
                      {filters.minPrice ? `$${filters.minPrice}` : '$0'} - {filters.maxPrice ? `$${filters.maxPrice}` : 'Any'}
                    </span>
                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('minPrice');
                        newParams.delete('maxPrice');
                        setSearchParams(newParams);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                {filters.featured && (
                  <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span className="font-medium">Featured Only</span>
                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, featured: false }));
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('featured');
                        setSearchParams(newParams);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                {filters.search && (
                  <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span className="mr-1">Search: </span>
                    <span className="font-medium">{filters.search}</span>
                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, search: '' }));
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('search');
                        setSearchParams(newParams);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                <button
                  onClick={clearFilters}
                  className="text-red-600 text-sm hover:underline focus:outline-none ml-auto"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
          
          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center p-12 bg-white rounded-lg shadow-sm">
              <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-xl font-medium text-gray-900 mb-2">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg shadow-sm">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p className="text-xl font-medium text-gray-900 mb-2">No products found</p>
              <p className="text-gray-600 mb-4">Try changing your filters or search terms</p>
              <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && !loading && products.length > 0 && (
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* First page */}
                {page > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                )}
                
                {/* Ellipsis before */}
                {page > 3 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Page before current */}
                {page > 1 && (
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {page - 1}
                  </button>
                )}
                
                {/* Current page */}
                <button
                  className="relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600"
                >
                  {page}
                </button>
                
                {/* Page after current */}
                {page < pagination.totalPages && (
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {page + 1}
                  </button>
                )}
                
                {/* Ellipsis after */}
                {page < pagination.totalPages - 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Last page */}
                {page < pagination.totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {pagination.totalPages}
                  </button>
                )}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === pagination.totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;