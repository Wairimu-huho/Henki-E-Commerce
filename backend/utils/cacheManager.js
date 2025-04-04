// utils/cacheManager.js
const NodeCache = require('node-cache');
const Redis = require('ioredis'); // or your preferred caching solution

// Create cache instances with different TTLs (time-to-live)
const shortCache = new NodeCache({ stdTTL: 60 }); // 1 minute
const mediumCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

const redis = new Redis(/* your redis config */);

/**
 * Cache wrapper for database queries
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if not in cache
 * @param {string} duration - Cache duration ('short', 'medium', 'long')
 * @returns {Promise<any>} - Cached or freshly fetched data
 */
const getCachedData = async (key, fetchFunction, duration = 'short') => {
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch fresh data
    const freshData = await fetchFunction();
    
    // Set cache duration
    const expiryTime = duration === 'short' ? 300 : // 5 minutes
                      duration === 'medium' ? 1800 : // 30 minutes
                      3600; // 1 hour (default)

    // Store in cache
    await redis.setex(key, expiryTime, JSON.stringify(freshData));
    
    return freshData;
  } catch (error) {
    console.error('Cache error:', error);
    // If cache fails, just return the fresh data
    return fetchFunction();
  }
};

/**
 * Clear specific cache entry
 * @param {string} key - Cache key to clear
 * @param {string} duration - Cache duration ('short', 'medium', 'long', 'all')
 */
const clearCache = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear cache entries by pattern
 * @param {string} pattern - Pattern to match cache keys (e.g., 'product:*')
 */
const clearCachePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Error clearing cache pattern:', error);
  }
};

module.exports = {
  getCachedData,
  clearCache,
  clearCachePattern,
  shortCache,
  mediumCache,
  longCache
};