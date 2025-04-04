const mongoose = require('mongoose');

// Track query counts
const queryStats = {
  count: 0,
  collections: {},
  operations: {},
  slow: 0
};

// Reset statistics
const resetStats = () => {
  queryStats.count = 0;
  queryStats.collections = {};
  queryStats.operations = {};
  queryStats.slow = 0;
};

// Start monitoring
const startMonitoring = () => {
  console.log('Starting MongoDB query monitoring');
  
  // Store original mongoose exec function
  const originalExec = mongoose.Query.prototype.exec;
  
  // Override exec function to collect stats
  mongoose.Query.prototype.exec = function() {
    const startTime = Date.now();
    
    // Get collection and operation
    const collection = this.model.collection.name;
    const operation = this.op;
    
    // Update stats
    queryStats.count++;
    
    // Update collection stats
    if (!queryStats.collections[collection]) {
      queryStats.collections[collection] = 0;
    }
    queryStats.collections[collection]++;
    
    // Update operation stats
    if (!queryStats.operations[operation]) {
      queryStats.operations[operation] = 0;
    }
    queryStats.operations[operation]++;
    
    // Execute the original function
    const result = originalExec.apply(this, arguments);
    
    // If result is a promise, add timing
    if (result && typeof result.then === 'function') {
      return result.then((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Count slow queries
        if (duration > 100) { // 100ms threshold
          queryStats.slow++;
        }
        
        return data;
      });
    }
    
    return result;
  };
};

// Get current stats
const getStats = () => {
  return {
    ...queryStats,
    timestamp: new Date()
  };
};

module.exports = {
  startMonitoring,
  getStats,
  resetStats
};