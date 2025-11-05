/**
 * Food Cache Service
 * Implements Redis caching for food system performance optimization
 */

import redis from 'redis';
import logger from '../../utils/logger.js';

class FoodCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Check if Redis is available
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL
        });
        
        this.client.on('error', (err) => {
          logger.warn('Redis connection error:', err.message);
          this.isConnected = false;
        });
        
        this.client.on('connect', () => {
          logger.info('Redis connected successfully');
          this.isConnected = true;
        });
        
        await this.client.connect();
      } else {
        logger.info('Redis not configured, using in-memory cache');
        this.memoryCache = new Map();
        this.isConnected = true;
      }
    } catch (error) {
      logger.warn('Redis initialization failed, using in-memory cache:', error.message);
      this.memoryCache = new Map();
      this.isConnected = true;
    }
  }

  async get(key) {
    try {
      if (this.client && this.isConnected) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else if (this.memoryCache) {
        const item = this.memoryCache.get(key);
        if (item && item.expires > Date.now()) {
          return item.value;
        } else if (item) {
          this.memoryCache.delete(key);
        }
        return null;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.client && this.isConnected) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else if (this.memoryCache) {
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      logger.error('Cache set error:', error.message);
    }
  }

  async del(key) {
    try {
      if (this.client && this.isConnected) {
        await this.client.del(key);
      } else if (this.memoryCache) {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.error('Cache delete error:', error.message);
    }
  }

  async flush() {
    try {
      if (this.client && this.isConnected) {
        await this.client.flushAll();
      } else if (this.memoryCache) {
        this.memoryCache.clear();
      }
    } catch (error) {
      logger.error('Cache flush error:', error.message);
    }
  }

  // Food-specific cache methods
  async getMenuItems() {
    return await this.get('food:menu:items');
  }

  async setMenuItems(items, ttl = 600) {
    await this.set('food:menu:items', items, ttl);
  }

  async getCategories() {
    return await this.get('food:categories');
  }

  async setCategories(categories, ttl = 1800) {
    await this.set('food:categories', categories, ttl);
  }

  async getPopularItems(timeRange = '7days') {
    return await this.get(`food:popular:${timeRange}`);
  }

  async setPopularItems(items, timeRange = '7days', ttl = 300) {
    await this.set(`food:popular:${timeRange}`, items, ttl);
  }

  async getAnalyticsOverview(timeRange = '7days') {
    return await this.get(`food:analytics:overview:${timeRange}`);
  }

  async setAnalyticsOverview(data, timeRange = '7days', ttl = 300) {
    await this.set(`food:analytics:overview:${timeRange}`, data, ttl);
  }

  async getOrderStats() {
    return await this.get('food:orders:stats');
  }

  async setOrderStats(stats, ttl = 60) {
    await this.set('food:orders:stats', stats, ttl);
  }

  async getPeakHours(timeRange = '7days') {
    return await this.get(`food:analytics:peak:${timeRange}`);
  }

  async setPeakHours(data, timeRange = '7days', ttl = 300) {
    await this.set(`food:analytics:peak:${timeRange}`, data, ttl);
  }

  // Cache invalidation methods
  async invalidateMenuCache() {
    await this.del('food:menu:items');
    await this.del('food:categories');
    logger.info('Menu cache invalidated');
  }

  async invalidateAnalyticsCache() {
    const keys = ['food:analytics:overview', 'food:popular', 'food:analytics:peak'];
    for (const key of keys) {
      await this.del(key);
    }
    logger.info('Analytics cache invalidated');
  }

  async invalidateOrderCache() {
    await this.del('food:orders:stats');
    logger.info('Order cache invalidated');
  }

  // Cache warming methods
  async warmMenuCache() {
    try {
      const MenuItem = (await import('../../models/MenuItem.js')).default;
      const Category = (await import('../../models/Category.js')).default;
      
      const [items, categories] = await Promise.all([
        MenuItem.find({ isActive: true }).sort({ createdAt: -1 }),
        Category.find({ isActive: true }).sort({ name: 1 })
      ]);
      
      await this.setMenuItems(items);
      await this.setCategories(categories);
      
      logger.info('Menu cache warmed successfully');
    } catch (error) {
      logger.error('Menu cache warming failed:', error.message);
    }
  }

  async warmAnalyticsCache() {
    try {
      const FoodAnalyticsService = (await import('./foodAnalyticsService.js')).default;
      
      const timeRanges = ['today', '7days', '30days'];
      for (const range of timeRanges) {
        const { startDate, endDate } = this.getDateRange(range);
        
        const [overview, popular, peak] = await Promise.all([
          FoodAnalyticsService.getDashboardOverview(),
          FoodAnalyticsService.getPopularItems(10, startDate, endDate),
          FoodAnalyticsService.getPeakHours(startDate, endDate)
        ]);
        
        await this.setAnalyticsOverview(overview, range);
        await this.setPopularItems(popular, range);
        await this.setPeakHours(peak, range);
      }
      
      logger.info('Analytics cache warmed successfully');
    } catch (error) {
      logger.error('Analytics cache warming failed:', error.message);
    }
  }

  getDateRange(range) {
    const endDate = new Date();
    const startDate = new Date();
    
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7days') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === '30days') {
      startDate.setDate(endDate.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (this.client && this.isConnected) {
        await this.client.ping();
        return { status: 'healthy', type: 'redis' };
      } else if (this.memoryCache) {
        return { status: 'healthy', type: 'memory', size: this.memoryCache.size };
      }
      return { status: 'unhealthy', type: 'none' };
    } catch (error) {
      return { status: 'unhealthy', type: 'error', error: error.message };
    }
  }
}

export default new FoodCacheService();
