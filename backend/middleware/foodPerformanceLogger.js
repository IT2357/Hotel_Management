import logger from '../utils/logger.js';

/**
 * Performance monitoring middleware for food-related endpoints
 */
export const foodPerformanceLogger = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture metrics
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const responseTime = endTime - startTime;
    const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log performance metrics
    const metrics = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime,
      memoryUsed: memoryUsed,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Log based on performance thresholds
    if (responseTime > 5000) {
      logger.warn('Slow food API response detected', metrics);
    } else if (responseTime > 2000) {
      logger.info('Moderate food API response time', metrics);
    } else {
      logger.debug('Food API performance metrics', metrics);
    }
    
    // Log memory usage if high
    if (memoryUsed > 50 * 1024 * 1024) { // 50MB
      logger.warn('High memory usage detected in food API', {
        ...metrics,
        memoryUsedMB: Math.round(memoryUsed / 1024 / 1024)
      });
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error tracking middleware for food endpoints
 */
export const foodErrorTracker = (err, req, res, next) => {
  const errorMetrics = {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    body: req.body,
    query: req.query,
    params: req.params
  };
  
  logger.error('Food API error occurred', errorMetrics);
  
  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Request/Response logging middleware for food endpoints
 */
export const foodRequestLogger = (req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  req.requestId = requestId;
  
  logger.info('Food API request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    body: req.method !== 'GET' ? req.body : undefined
  });
  
  next();
};

/**
 * Order processing time tracker
 */
export const orderProcessingTracker = (req, res, next) => {
  if (req.originalUrl.includes('/food/orders')) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const processingTime = Date.now() - startTime;
      
      logger.info('Order processing completed', {
        method: req.method,
        url: req.originalUrl,
        processingTime,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  next();
};

export default {
  foodPerformanceLogger,
  foodErrorTracker,
  foodRequestLogger,
  orderProcessingTracker
};
