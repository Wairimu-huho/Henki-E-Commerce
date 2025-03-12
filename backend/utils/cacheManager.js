// utils/cacheManager.js
const NodeCache = require('node-cache');

// Create cache instances with different TTLs (time-to-live)
const shortCache = new NodeCache({ stdTTL: 60 }); // 1 minute
const mediumCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

/**
 * Cache wrapper for database queries
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if not in cache
 * @param {string} duration - Cache duration ('short', 'medium', 'long')
 * @returns {Promise<any>} - Cached or freshly fetched data
 */
const getCachedData = async (key, fetchFunction, duration = 'medium') => {
  // Select cache based on duration
  const cache = 
    duration === 'short' ? shortCache : 
    duration === 'long' ? longCache : 
    mediumCache;
  
  // Check if data exists in cache
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    return cachedData;
  }
  
  // If not in cache, fetch fresh data
  const freshData = await fetchFunction();
  
  // Store in cache for next time
  cache.set(key, freshData);
  
  return freshData;
};

/**
 * Clear specific cache entry
 * @param {string} key - Cache key to clear
 * @param {string} duration - Cache duration ('short', 'medium', 'long', 'all')
 */
const clearCache = (key, duration = 'all') => {
  if (duration === 'short' || duration === 'all') {
    shortCache.del(key);
  }
  
  if (duration === 'medium' || duration === 'all') {
    mediumCache.del(key);
  }
  
  if (duration === 'long' || duration === 'all') {
    longCache.del(key);
  }
};

/**
 * Clear cache entries by pattern
 * @param {string} pattern - Pattern to match cache keys (e.g., 'product:*')
 */
const clearCachePattern = (pattern) => {
  const regex = new RegExp(pattern.replace('*', '.*'));
  
  // Clear from all caches
  [shortCache, mediumCache, longCache].forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (regex.test(key)) {
        cache.del(key);
      }
    });
  });
};

module.exports = {
  getCachedData,
  clearCache,
  clearCachePattern,
  shortCache,
  mediumCache,
  longCache
};