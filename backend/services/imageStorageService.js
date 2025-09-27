import gridfsService from './gridfsService.js';
import cloudinaryService from './cloudinaryService.js';
import config from '../config/environment.js';

/**
 * Unified image storage service that supports multiple providers
 * Currently supports: GridFS (MongoDB) and Cloudinary
 */
class ImageStorageService {
  constructor() {
    this.provider = config.IMAGE_STORAGE_PROVIDER || 'gridfs';
    this.services = {
      gridfs: gridfsService,
      cloudinary: cloudinaryService
    };

    console.log(`📦 Using ${this.provider} as image storage provider`);
  }

  /**
   * Get the current storage service
   */
  getService() {
    const service = this.services[this.provider];
    if (!service) {
      throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
    return service;
  }

  /**
   * Upload image buffer
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Original filename
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Image identifier (GridFS ID or Cloudinary public ID)
   */
  async uploadImage(imageBuffer, filename, metadata = {}) {
    const service = this.getService();

    try {
      const result = await service.uploadImage(imageBuffer, filename, metadata);

      // Return prefixed identifier to indicate storage provider
      return `${this.provider}:${result}`;
    } catch (error) {
      console.error(`❌ Image upload failed with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Upload image from file path
   * @param {string} filePath - Path to image file
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Image identifier
   */
  async uploadImageFromPath(filePath, metadata = {}) {
    const service = this.getService();

    try {
      const result = await service.uploadImageFromPath(filePath, metadata);
      return `${this.provider}:${result}`;
    } catch (error) {
      console.error(`❌ Image upload from path failed with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Upload image from URL
   * @param {string} imageUrl - Image URL
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Image identifier
   */
  async uploadImageFromUrl(imageUrl, metadata = {}) {
    const service = this.getService();

    try {
      const result = await service.uploadImageFromUrl(imageUrl, metadata);
      return `${this.provider}:${result}`;
    } catch (error) {
      console.error(`❌ Image upload from URL failed with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Get image URL or stream
   * @param {string} imageId - Prefixed image identifier (provider:id)
   * @returns {Promise<Object|string>} - Image URL (Cloudinary) or stream/metadata (GridFS)
   */
  async getImage(imageId) {
    const [provider, id] = this.parseImageId(imageId);
    const service = this.services[provider];

    if (!service) {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    try {
      if (provider === 'cloudinary') {
        // Return optimized URL for Cloudinary
        return service.getImageUrl(id);
      } else if (provider === 'gridfs') {
        // Return stream and metadata for GridFS
        return await service.getImageStream(id);
      }
    } catch (error) {
      console.error(`❌ Image retrieval failed with ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get image as buffer
   * @param {string} imageId - Prefixed image identifier
   * @returns {Promise<Buffer>} - Image buffer
   */
  async getImageBuffer(imageId) {
    const [provider, id] = this.parseImageId(imageId);
    const service = this.services[provider];

    if (!service) {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    try {
      if (provider === 'cloudinary') {
        // For Cloudinary, we need to fetch the image
        const axios = (await import('axios')).default;
        const url = service.getImageUrl(id, { quality: 'auto', fetch_format: 'auto' });
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      } else if (provider === 'gridfs') {
        return await service.getImageBuffer(id);
      }
    } catch (error) {
      console.error(`❌ Image buffer retrieval failed with ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Delete image
   * @param {string} imageId - Prefixed image identifier
   * @returns {Promise<boolean>} - Success status
   */
  async deleteImage(imageId) {
    const [provider, id] = this.parseImageId(imageId);
    const service = this.services[provider];

    if (!service) {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    try {
      return await service.deleteImage(id);
    } catch (error) {
      console.error(`❌ Image deletion failed with ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Check if image exists
   * @param {string} imageId - Prefixed image identifier
   * @returns {Promise<boolean>} - Exists status
   */
  async imageExists(imageId) {
    const [provider, id] = this.parseImageId(imageId);
    const service = this.services[provider];

    if (!service) {
      return false;
    }

    try {
      return await service.imageExists(id);
    } catch (error) {
      console.error(`❌ Image existence check failed with ${provider}:`, error);
      return false;
    }
  }

  /**
   * List images
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of images
   */
  async listImages(options = {}) {
    const service = this.getService();

    try {
      const result = await service.listImages(options);

      // Add provider prefix to image IDs
      if (this.provider === 'cloudinary') {
        result.images = result.images.map(img => ({
          ...img,
          id: `${this.provider}:${img.publicId}`,
          publicId: undefined // Remove publicId, use id instead
        }));
      } else if (this.provider === 'gridfs') {
        result.images = result.images.map(img => ({
          ...img,
          id: `${this.provider}:${img.id}`
        }));
      }

      return result;
    } catch (error) {
      console.error(`❌ Image listing failed with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} - Storage statistics
   */
  async getStats() {
    const service = this.getService();

    try {
      if (this.provider === 'cloudinary') {
        return await service.getUsageStats();
      } else if (this.provider === 'gridfs') {
        return await service.getStats();
      }
    } catch (error) {
      console.error(`❌ Stats retrieval failed with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Parse image ID to extract provider and actual ID
   * @param {string} imageId - Prefixed image identifier
   * @returns {Array} - [provider, id]
   */
  parseImageId(imageId) {
    if (!imageId || typeof imageId !== 'string') {
      throw new Error('Invalid image ID');
    }

    const parts = imageId.split(':');
    if (parts.length < 2) {
      // Legacy support: assume GridFS if no prefix
      return ['gridfs', imageId];
    }

    const [provider, ...idParts] = parts;
    const id = idParts.join(':'); // Handle IDs that contain colons

    if (!this.services[provider]) {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    return [provider, id];
  }

  /**
   * Switch storage provider (for testing purposes)
   * @param {string} provider - New provider ('gridfs' or 'cloudinary')
   */
  switchProvider(provider) {
    if (!this.services[provider]) {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    this.provider = provider;
    console.log(`🔄 Switched to ${provider} as image storage provider`);
  }

  /**
   * Get current provider
   * @returns {string} - Current provider
   */
  getCurrentProvider() {
    return this.provider;
  }
}

export default new ImageStorageService();