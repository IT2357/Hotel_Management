/**
 * Food Cache Middleware
 * Implements caching for food API endpoints
 */

import foodCacheService from '../services/cache/foodCacheService.js';
import logger from '../utils/logger.js';

// Cache configuration for different endpoints
const CACHE_CONFIG = {
  '/api/food/items': { ttl: 600, key: 'food:menu:items' },
  '/api/food/categories': { ttl: 1800, key: 'food:categories' },
  '/api/food/analytics/overview': { ttl: 300, key: 'food:analytics:overview' },
  '/api/food/analytics/items/popular': { ttl: 300, key: 'food:popular' },
  '/api/food/analytics/peak-hours': { ttl: 300, key: 'food:analytics:peak' },
  '/api/food/health': { ttl: 60, key: 'food:health' }
};

export const foodCacheMiddleware = (req, res, next) => {
  const originalSend = res.send;
  const cacheKey = getCacheKey(req);
  
  if (!cacheKey) {
    return next();
  }

  // Try to get from cache
  foodCacheService.get(cacheKey)
    .then(cachedData => {
      if (cachedData) {
        logger.info(`Cache hit for ${req.originalUrl}`);
        return res.json(cachedData);
      }
      
      // Cache miss - override res.send to cache the response
      res.send = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data) {
          const config = CACHE_CONFIG[req.path];
          if (config) {
            foodCacheService.set(cacheKey, JSON.parse(data), config.ttl)
              .then(() => {
                logger.info(`Cached response for ${req.originalUrl}`);
              })
              .catch(err => {
                logger.error(`Cache set error for ${req.originalUrl}:`, err.message);
              });
          }
        }
        originalSend.call(this, data);
      };
      
      next();
    })
    .catch(err => {
      logger.error(`Cache get error for ${req.originalUrl}:`, err.message);
      next();
    });
};

export const invalidateFoodCache = async (req, res, next) => {
  try {
    await foodCacheService.invalidateMenuCache();
    logger.info('Food cache invalidated after menu update');
    next();
  } catch (error) {
    logger.error('Cache invalidation error:', error.message);
    next();
  }
};

export const invalidateAnalyticsCache = async (req, res, next) => {
  try {
    await foodCacheService.invalidateAnalyticsCache();
    logger.info('Analytics cache invalidated after data update');
    next();
  } catch (error) {
    logger.error('Analytics cache invalidation error:', error.message);
    next();
  }
};

function getCacheKey(req) {
  const config = CACHE_CONFIG[req.path];
  if (!config) return null;
  
  // Add query parameters to cache key for analytics
  if (req.path.includes('/analytics/')) {
    const queryString = new URLSearchParams(req.query).toString();
    return queryString ? `${config.key}:${queryString}` : config.key;
  }
  
  return config.key;
}

// Cache warming middleware
export const warmFoodCache = async (req, res, next) => {
  try {
    await foodCacheService.warmMenuCache();
    await foodCacheService.warmAnalyticsCache();
    logger.info('Food cache warmed successfully');
    next();
  } catch (error) {
    logger.error('Cache warming error:', error.message);
    next();
  }
};

// Cache health check
export const cacheHealthCheck = async (req, res, next) => {
  try {
    const health = await foodCacheService.healthCheck();
    res.json({
      success: true,
      cache: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
