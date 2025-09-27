import cloudinary from '../config/cloudinary.js';
import config from '../config/environment.js';
import crypto from 'crypto';
import path from 'path';

class CloudinaryService {
  constructor() {
    this.initialized = false;
    this.initializeCloudinary();
  }

  /**
   * Initialize Cloudinary
   */
  initializeCloudinary() {
    try {
      if (config.CLOUDINARY.CLOUD_NAME && config.CLOUDINARY.API_KEY && config.CLOUDINARY.API_SECRET) {
        this.initialized = true;
        console.log('✅ Cloudinary service initialized');
      } else {
        console.warn('⚠️ Cloudinary credentials not configured');
      }
    } catch (error) {
      console.error('❌ Cloudinary initialization error:', error);
    }
  }

  /**
   * Upload image to Cloudinary
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Original filename
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Cloudinary public ID
   */
  async uploadImage(imageBuffer, filename, metadata = {}) {
    return new Promise((resolve, reject) => {
      if (!this.initialized) {
        return reject(new Error('Cloudinary not initialized'));
      }

      try {
        // Generate unique public ID
        const ext = path.extname(filename) || '.jpg';
        const uniqueId = `${crypto.randomUUID()}${ext}`;

        // Upload options
        const uploadOptions = {
          public_id: uniqueId,
          folder: 'menu_images',
          resource_type: 'image',
          format: this.getFormatFromExtension(ext),
          metadata: {
            original_filename: filename,
            upload_date: new Date().toISOString(),
            ...metadata
          }
        };

        // Upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log(`✅ Image uploaded to Cloudinary: ${result.public_id}`);
              resolve(result.public_id);
            }
          }
        );

        // Write buffer to stream
        uploadStream.end(imageBuffer);

      } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        reject(error);
      }
    });
  }

  /**
   * Upload image from file path
   * @param {string} filePath - Path to image file
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Cloudinary public ID
   */
  async uploadImageFromPath(filePath, metadata = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const filename = path.basename(filePath);

      // Upload options
      const uploadOptions = {
        folder: 'menu_images',
        resource_type: 'image',
        metadata: {
          original_filename: filename,
          source_path: filePath,
          upload_date: new Date().toISOString(),
          ...metadata
        }
      };

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      console.log(`✅ Image uploaded to Cloudinary from path: ${result.public_id}`);

      return result.public_id;
    } catch (error) {
      console.error('❌ Cloudinary upload from path error:', error);
      throw error;
    }
  }

  /**
   * Upload image from URL
   * @param {string} imageUrl - Image URL
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Cloudinary public ID
   */
  async uploadImageFromUrl(imageUrl, metadata = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const filename = this.extractFilenameFromUrl(imageUrl);

      // Upload options
      const uploadOptions = {
        folder: 'menu_images',
        resource_type: 'image',
        metadata: {
          original_filename: filename,
          source_url: imageUrl,
          upload_date: new Date().toISOString(),
          ...metadata
        }
      };

      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);
      console.log(`✅ Image uploaded to Cloudinary from URL: ${result.public_id}`);

      return result.public_id;
    } catch (error) {
      console.error('❌ Cloudinary upload from URL error:', error);
      throw error;
    }
  }

  /**
   * Get image URL from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} - Image URL
   */
  getImageUrl(publicId, options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const defaultOptions = {
        width: 800,
        height: 600,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
        ...options
      };

      return cloudinary.url(publicId, defaultOptions);
    } catch (error) {
      console.error('❌ Cloudinary URL generation error:', error);
      throw error;
    }
  }

  /**
   * Get image metadata
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} - Image metadata
   */
  async getImageMetadata(publicId) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image'
      });

      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
        url: result.url,
        secureUrl: result.secure_url,
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('❌ Cloudinary metadata error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteImage(publicId) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image'
      });

      if (result.result === 'ok') {
        console.log(`✅ Image deleted from Cloudinary: ${publicId}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to delete image from Cloudinary: ${publicId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * List images with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of images
   */
  async listImages(options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const { max_results = 20, next_cursor } = options;

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'menu_images/',
        max_results,
        next_cursor,
        resource_type: 'image'
      });

      return {
        images: result.resources.map(resource => ({
          publicId: resource.public_id,
          filename: resource.public_id.split('/').pop(),
          format: resource.format,
          width: resource.width,
          height: resource.height,
          bytes: resource.bytes,
          createdAt: resource.created_at,
          url: resource.url,
          secureUrl: resource.secure_url
        })),
        nextCursor: result.next_cursor,
        totalCount: result.total_count
      };
    } catch (error) {
      console.error('❌ Cloudinary list error:', error);
      throw error;
    }
  }

  /**
   * Check if image exists
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} - Exists status
   */
  async imageExists(publicId) {
    try {
      if (!this.initialized) {
        return false;
      }

      await cloudinary.api.resource(publicId, { resource_type: 'image' });
      return true;
    } catch (error) {
      if (error.http_code === 404) {
        return false;
      }
      console.error('❌ Cloudinary exists check error:', error);
      return false;
    }
  }

  /**
   * Get format from file extension
   * @param {string} ext - File extension
   * @returns {string} - Format
   */
  getFormatFromExtension(ext) {
    const formatMap = {
      '.jpg': 'jpg',
      '.jpeg': 'jpg',
      '.png': 'png',
      '.gif': 'gif',
      '.webp': 'webp',
      '.bmp': 'bmp',
      '.svg': 'svg'
    };

    return formatMap[ext.toLowerCase()] || 'jpg';
  }

  /**
   * Extract filename from URL
   * @param {string} url - Image URL
   * @returns {string} - Filename
   */
  extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);

      // If no extension, add .jpg
      if (!path.extname(filename)) {
        return filename + '.jpg';
      }

      return filename || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }

  /**
   * Get Cloudinary usage stats
   * @returns {Promise<Object>} - Usage statistics
   */
  async getUsageStats() {
    try {
      if (!this.initialized) {
        throw new Error('Cloudinary not initialized');
      }

      const usage = await cloudinary.api.usage();

      return {
        storage: usage.storage,
        bandwidth: usage.bandwidth,
        requests: usage.requests,
        resources: usage.resources,
        derivedResources: usage.derived_resources,
        transformations: usage.transformations
      };
    } catch (error) {
      console.error('❌ Cloudinary usage stats error:', error);
      throw error;
    }
  }
}

export default new CloudinaryService();