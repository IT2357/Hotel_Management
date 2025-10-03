import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Rate limiting for different endpoints
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limit
export const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests from this IP, please try again later.'
);

// Auth rate limit (more restrictive)
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  'Too many authentication attempts, please try again later.'
);

// File upload rate limit
export const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // 20 uploads per hour
  'Too many file uploads, please try again later.'
);

// Data sanitization middleware
export const dataSanitization = (req, res, next) => {
  // Sanitize MongoDB operators
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.query) {
    mongoSanitize.sanitize(req.query);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }

  next();
};

// XSS protection
export const xssProtection = xss();

// Prevent parameter pollution
export const preventParamPollution = hpp();

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.cloudinary.com; " +
      "frame-ancestors 'none';"
    );
  }

  next();
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.originalUrl;

  // Log suspicious activities
  if (req.originalUrl.includes('..') || req.originalUrl.includes('%2e%2e')) {
    console.warn(`🚨 SECURITY: Path traversal attempt from ${ip}: ${method} ${url}`);
  }

  if (req.body && JSON.stringify(req.body).length > 10000) {
    console.warn(`🚨 SECURITY: Large payload from ${ip}: ${method} ${url} (${JSON.stringify(req.body).length} chars)`);
  }

  // Log all auth attempts
  if (url.includes('/auth/')) {
    console.log(`🔐 AUTH: ${timestamp} - ${ip} - ${method} ${url} - ${userAgent}`);
  }

  next();
};

// Input validation helpers
export const validateInput = {
  // Sanitize string input
  sanitizeString: (str, maxLength = 1000) => {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
  },

  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate MongoDB ObjectId
  isValidObjectId: (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  },

  // Check for SQL injection patterns
  hasSQLInjection: (str) => {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\%27)|(\%23))/i
    ];
    return sqlPatterns.some(pattern => pattern.test(str));
  },

  // Check for XSS patterns
  hasXSS: (str) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ];
    return xssPatterns.some(pattern => pattern.test(str));
  }
};