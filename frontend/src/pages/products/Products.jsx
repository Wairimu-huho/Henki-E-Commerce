// src/pages/Products.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import FilterSidebar from '../../components/product/FilterSidebar';
import Pagination from '../../components/common/Pagination';
import SortDropdown from '../../components/product/SortDropdown';
import SearchBar from '../../components/common/SearchBar';
import ApiService from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get current filter values from URL params
  const currentPage = parseInt(searchParams.get('page') || '1');
  const categoryFilter = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortOption = searchParams.get('sort') || 'newest';
  const priceMin = searchParams.get('min') || '';
  const priceMax = searchParams.get('max') || '';
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    // Fetch all categories
    const fetchCategories = async () => {
      try {
        const { data } = await ApiService.categories.getAll();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = {
          page: currentPage,
          ...(categoryFilter && { category: categoryFilter }),
          ...(searchQuery && { search: searchQuery }),
          ...(sortOption && { sort: sortOption }),
          ...(priceMin && { min: priceMin }),
          ...(priceMax && { max: priceMax }),
        };
        
        const { data } = await ApiService.products.getAll(params);
        
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, categoryFilter, searchQuery, sortOption, priceMin, priceMax]);

  const handlePageChange = (pageNumber) => {
    setSearchParams(prev => {
      prev.set('page', pageNumber);
      return prev;
    });
  };

  const handleCategoryChange = (category) => {
    setSearchParams(prev => {
      if (category) {
        prev.set('category', category);
      } else {
        prev.delete('category');
      }
      prev.set('page', '1'); // Reset to first page on category change
      return prev;
    });
  };

  const handleSortChange = (sortValue) => {
    setSearchParams(prev => {
      prev.set('sort', sortValue);
      return prev;
    });
  };

  const handlePriceFilter = (min, max) => {
    setSearchParams(prev => {
      if (min) {
        prev.set('min', min);
      } else {
        prev.delete('min');
      }
      
      if (max) {
        prev.set('max', max);
      } else {
        prev.delete('max');
      }
      
      prev.set('page', '1'); // Reset to first page on price filter change
      return prev;
    });
  };

  const handleSearch = (query) => {
    if (query) {
      setSearchParams(prev => {
        prev.set('search', query);
        prev.set('page', '1'); // Reset to first page on new search
        return prev;
      });
    } else {
      setSearchParams(prev => {
        prev.delete('search');
        prev.set('page', '1');
        return prev;
      });
    }
  };

  const clearAllFilters = () => {
    navigate('/products');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      
      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <SearchBar 
          initialValue={searchQuery} 
          onSearch={handleSearch} 
          placeholder="Search products..." 
        />
        
        <div className="flex items-center">
          <SortDropdown value={sortOption} onChange={handleSortChange} />
          
          {/* Mobile filter button */}
          <button
            type="button"
            className="md:hidden ml-4 p-2 bg-gray-100 rounded-md"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <span className="sr-only">Filters</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter Sidebar - Desktop */}
        <div className="hidden md:block w-full md:w-1/4 lg:w-1/5">
          <FilterSidebar
            categories={categories}
            selectedCategory={categoryFilter}
            priceMin={priceMin}
            priceMax={priceMax}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceFilter}
            onClearFilters={clearAllFilters}
          />
        </div>
        
        {/* Mobile Filter Sidebar */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileFiltersOpen(false)}></div>
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-400"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 px-4">
                <FilterSidebar
                  categories={categories}
                  selectedCategory={categoryFilter}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  onCategoryChange={(category) => {
                    handleCategoryChange(category);
                    setMobileFiltersOpen(false);
                  }}
                  onPriceChange={(min, max) => {
                    handlePriceFilter(min, max);
                    setMobileFiltersOpen(false);
                  }}
                  onClearFilters={() => {
                    clearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {/* Active Filters */}
          {(categoryFilter || searchQuery || priceMin || priceMax) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {categoryFilter && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm">
                  Category: {categoryFilter}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => handleCategoryChange('')}
                  >
                    &times;
                  </button>
                </span>
              )}
              
              {searchQuery && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm">
                  Search: {searchQuery}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => handleSearch('')}
                  >
                    &times;
                  </button>
                </span>
              )}
              
              {(priceMin || priceMax) && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm">
                  Price: {priceMin ? `${priceMin}` : '$0'} - {priceMax ? `${priceMax}` : 'Any'}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => handlePriceFilter('', '')}
                  >
                    &times;
                  </button>
                </span>
              )}
              
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;