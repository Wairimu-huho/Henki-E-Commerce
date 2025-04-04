// middleware/mongoQueryMiddleware.js
const mongoose = require('mongoose');

const slowQueryThreshold = process.env.SLOW_QUERY_THRESHOLD || 100; // ms

const logSlowQueries = function(req, res, next) {
  const startTime = Date.now();
  
  // Store original mongoose exec function
  const originalExec = mongoose.Query.prototype.exec;
  
  // Override exec function
  mongoose.Query.prototype.exec = function() {
    // Get query information
    const queryInfo = {
      collection: this.model.collection.name,
      operation: this.op,
      query: JSON.stringify(this.getQuery()),
      options: JSON.stringify(this._mongooseOptions),
      endpoint: req.originalUrl,
      method: req.method
    };
    
    // Execute the original exec function
    const result = originalExec.apply(this, arguments);
    
    // If result is a promise, add timing
    if (result && typeof result.then === 'function') {
      return result.then((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log slow queries
        if (duration > slowQueryThreshold) {
          console.warn(`[SLOW QUERY] ${duration}ms - ${queryInfo.collection}.${queryInfo.operation}`, {
            ...queryInfo,
            duration
          });
        }
        
        return data;
      });
    }
    
    return result;
  };
  
  next();
};

module.exports = { logSlowQueries };