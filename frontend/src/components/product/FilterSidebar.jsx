// src/components/product/FilterSidebar.jsx
import React, { useState } from 'react';

const FilterSidebar = ({
  categories,
  selectedCategory,
  priceMin,
  priceMax,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
}) => {
  const [minPrice, setMinPrice] = useState(priceMin);
  const [maxPrice, setMaxPrice] = useState(priceMax);
  const [expanded, setExpanded] = useState({
    categories: true,
    price: true,
  });

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onPriceChange(minPrice, maxPrice);
  };

  const toggleSection = (section) => {
    setExpanded({
      ...expanded,
      [section]: !expanded[section],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-6 border-t pt-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => toggleSection('categories')}
        >
          <h4 className="font-medium text-gray-900">Categories</h4>
          <svg 
            className={`h-5 w-5 transition-transform ${expanded.categories ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {expanded.categories && (
          <div className="space-y-2 ml-1">
            <div className="flex items-center">
              <input
                id="category-all"
                name="category"
                type="radio"
                checked={!selectedCategory}
                onChange={() => onCategoryChange('')}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <label htmlFor="category-all" className="ml-3 text-sm text-gray-700">
                All Categories
              </label>
            </div>
            
            {categories.map((category) => (
              <div key={category._id} className="flex items-center">
                <input
                  id={`category-${category._id}`}
                  name="category"
                  type="radio"
                  checked={selectedCategory === category.name}
                  onChange={() => onCategoryChange(category.name)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <label htmlFor={`category-${category._id}`} className="ml-3 text-sm text-gray-700">
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="mb-6 border-t pt-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => toggleSection('price')}
        >
          <h4 className="font-medium text-gray-900">Price Range</h4>
          <svg 
            className={`h-5 w-5 transition-transform ${expanded.price ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {expanded.price && (
          <form onSubmit={handlePriceSubmit}>
            <div className="flex space-x-2 mb-3">
              <div className="w-1/2">
                <label htmlFor="min-price" className="sr-only">
                  Minimum Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="min-price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="w-1/2">
                <label htmlFor="max-price" className="sr-only">
                  Maximum Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="max-price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-sm"
            >
              Apply Price
            </button>
          </form>
        )}
      </div>

      {/* Predefined Price Ranges */}
      {expanded.price && (
        <div className="mb-6">
          <h5 className="font-medium text-sm text-gray-700 mb-2">Price Ranges</h5>
          <div className="space-y-2">
            <button
              type="button"
              className="block text-sm text-gray-700 hover:text-primary"
              onClick={() => {
                setMinPrice('');
                setMaxPrice('50');
                onPriceChange('', '50');
              }}
            >
              Under $50
            </button>
            <button
              type="button"
              className="block text-sm text-gray-700 hover:text-primary"
              onClick={() => {
                setMinPrice('50');
                setMaxPrice('100');
                onPriceChange('50', '100');
              }}
            >
              $50 to $100
            </button>
            <button
              type="button"
              className="block text-sm text-gray-700 hover:text-primary"
              onClick={() => {
                setMinPrice('100');
                setMaxPrice('200');
                onPriceChange('100', '200');
              }}
            >
              $100 to $200
            </button>
            <button
              type="button"
              className="block text-sm text-gray-700 hover:text-primary"
              onClick={() => {
                setMinPrice('200');
                setMaxPrice('');
                onPriceChange('200', '');
              }}
            >
              $200 & Above
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;