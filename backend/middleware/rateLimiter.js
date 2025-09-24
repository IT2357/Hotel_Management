import rateLimit from 'express-rate-limit';
import { AppError } from '../services/error/AppError.js';

/**
 * Basic rate limiter configuration
 */
export const rateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000) || 900
      });
    },
    ...options
  };

  return rateLimit(defaultOptions);
};

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts, please try again later.',
    error: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * API rate limiter for general API endpoints
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
    error: 'API_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Report generation rate limiter
 */
export const reportRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 report requests per windowMs
  message: {
    success: false,
    message: 'Report generation rate limit exceeded, please try again later.',
    error: 'REPORT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Export generation rate limiter (more restrictive)
 */
export const exportRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 export requests per windowMs
  message: {
    success: false,
    message: 'Export generation rate limit exceeded, please try again later.',
    error: 'EXPORT_RATE_LIMIT_EXCEEDED'
  }
});

export default rateLimiter;