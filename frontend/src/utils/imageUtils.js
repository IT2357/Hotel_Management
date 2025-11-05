/**
 * Image URL Utility
 * Centralized image URL construction for food system
 * Handles multiple image formats and provides consistent fallback logic
 */

// Get API base URL from environment or window origin
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  }
  
  return window.location.origin.includes('localhost') 
    ? 'http://localhost:5000' 
    : window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Default fallback image for food items
 */
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

/**
 * Get the full image URL for a menu item
 * Handles various image formats: imageUrl, imageId, image field
 * 
 * @param {Object} item - Menu item object
 * @param {string} item.imageUrl - Direct image URL (priority 1)
 * @param {string} item.imageId - GridFS image ID (priority 2)
 * @param {string} item.image - Image path or URL (priority 3)
 * @param {string} fallback - Optional custom fallback image URL
 * @returns {string} Full image URL or fallback
 */
export const getMenuItemImageUrl = (item, fallback = DEFAULT_FOOD_IMAGE) => {
  if (!item) return fallback;

  // Priority 1: Direct image URL
  if (item.imageUrl) {
    // If it's already a full URL, return it
    if (item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }
    // If it's a relative path, prepend base URL
    return `${API_BASE_URL}${item.imageUrl}`;
  }

  // Priority 2: GridFS image ID
  if (item.imageId) {
    return `${API_BASE_URL}/api/menu/image/${item.imageId}`;
  }

  // Priority 3: Image field (could be path or URL)
  if (item.image) {
    // If it's a full URL, return it
    if (item.image.startsWith('http')) {
      return item.image;
    }
    // If it starts with /api/, prepend base URL
    if (item.image.startsWith('/api/')) {
      return `${API_BASE_URL}${item.image}`;
    }
    // If it starts with /, prepend base URL
    if (item.image.startsWith('/')) {
      return `${API_BASE_URL}${item.image}`;
    }
    // Otherwise, assume it's a relative path and prepend /api/menu/image/
    return `${API_BASE_URL}/api/menu/image/${item.image}`;
  }

  // No image found, return fallback
  return fallback;
};

/**
 * Get category image URL
 * @param {Object} category - Category object
 * @param {string} fallback - Optional custom fallback
 * @returns {string} Image URL
 */
export const getCategoryImageUrl = (category, fallback = DEFAULT_FOOD_IMAGE) => {
  if (!category) return fallback;

  if (category.imageUrl) {
    return category.imageUrl.startsWith('http') 
      ? category.imageUrl 
      : `${API_BASE_URL}${category.imageUrl}`;
  }

  if (category.image) {
    return category.image.startsWith('http')
      ? category.image
      : `${API_BASE_URL}${category.image}`;
  }

  return fallback;
};

/**
 * Handle image load error
 * Sets the element's src to fallback image
 * 
 * @param {Event} event - Image error event
 * @param {string} fallback - Optional custom fallback
 */
export const handleImageError = (event, fallback = DEFAULT_FOOD_IMAGE) => {
  event.target.src = fallback;
  // Prevent infinite loop if fallback also fails
  event.target.onerror = null;
};

/**
 * Preload an image
 * Useful for improving perceived performance
 * 
 * @param {string} url - Image URL to preload
 * @returns {Promise} Resolves when image is loaded
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Batch preload multiple images
 * 
 * @param {string[]} urls - Array of image URLs
 * @returns {Promise} Resolves when all images are loaded
 */
export const preloadImages = async (urls) => {
  try {
    await Promise.all(urls.map(preloadImage));
    return true;
  } catch (error) {
    console.warn('Some images failed to preload:', error);
    return false;
  }
};

/**
 * Convert image to optimized format
 * Returns a srcset string for responsive images
 * 
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths (e.g., [200, 400, 800])
 * @returns {string} srcset string
 */
export const generateSrcset = (baseUrl, widths = [200, 400, 800, 1200]) => {
  // For now, return single URL
  // In production, you'd have image processing service
  return widths.map(w => `${baseUrl}?w=${w} ${w}w`).join(', ');
};

/**
 * Get optimized image URL with transformations
 * Works with Cloudinary or similar services
 * 
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.quality - Image quality (auto, low, high)
 * @param {string} options.format - Desired format (webp, jpg, png)
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  // If it's a Cloudinary URL, we can add transformations
  if (url.includes('cloudinary.com')) {
    const { width, height, quality = 'auto', format = 'auto' } = options;
    const transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);
    
    // Insert transformations into Cloudinary URL
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/$ {parts[1]}`;
    }
  }
  
  // For non-Cloudinary images, return original
  // In production, you'd implement server-side image processing
  return url;
};

export default {
  getMenuItemImageUrl,
  getCategoryImageUrl,
  handleImageError,
  preloadImage,
  preloadImages,
  generateSrcset,
  getOptimizedImageUrl,
  DEFAULT_FOOD_IMAGE,
  API_BASE_URL
};

