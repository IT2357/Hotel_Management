import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Image optimization utilities for menu items
 */
class ImageUtils {
  /**
   * Optimize image buffer for storage
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Optimization options
   * @returns {Buffer} Optimized image buffer
   */
  static async optimizeImage(buffer, options = {}) {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      let sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Resize if image is too large
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to specified format
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({ quality });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original buffer if optimization fails
      return buffer;
    }
  }

  /**
   * Validate image file
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Original filename
   * @returns {Object} Validation result
   */
  static async validateImage(buffer, filename) {
    try {
      const metadata = await sharp(buffer).metadata();

      // Check file size (max 15MB)
      if (buffer.length > 15 * 1024 * 1024) {
        return {
          valid: false,
          error: 'File size too large. Maximum size is 15MB.'
        };
      }

      // Check dimensions
      if (metadata.width < 50 || metadata.height < 50) {
        return {
          valid: false,
          error: 'Image dimensions too small. Minimum size is 50x50 pixels.'
        };
      }

      if (metadata.width > 5000 || metadata.height > 5000) {
        return {
          valid: false,
          error: 'Image dimensions too large. Maximum size is 5000x5000 pixels.'
        };
      }

      // Check format
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
      if (!allowedFormats.includes(metadata.format)) {
        return {
          valid: false,
          error: 'Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF.'
        };
      }

      return {
        valid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid image file. Please upload a valid image.'
      };
    }
  }

  /**
   * Generate thumbnail for menu item
   * @param {Buffer} buffer - Image buffer
   * @param {number} size - Thumbnail size (default: 200px)
   * @returns {Buffer} Thumbnail buffer
   */
  static async generateThumbnail(buffer, size = 200) {
    try {
      return await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return buffer; // Return original if thumbnail generation fails
    }
  }

  /**
   * Get image content type from buffer
   * @param {Buffer} buffer - Image buffer
   * @returns {string} Content type
   */
  static async getContentType(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const formatMap = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif'
      };
      return formatMap[metadata.format] || 'image/jpeg';
    } catch (error) {
      return 'image/jpeg'; // Default fallback
    }
  }

  /**
   * Compress image for web display
   * @param {Buffer} buffer - Image buffer
   * @param {number} maxSizeKB - Maximum size in KB (default: 500)
   * @returns {Buffer} Compressed image buffer
   */
  static async compressForWeb(buffer, maxSizeKB = 500) {
    try {
      let quality = 85;
      let compressedBuffer = buffer;

      // If image is larger than maxSizeKB, reduce quality iteratively
      while (compressedBuffer.length > maxSizeKB * 1024 && quality > 30) {
        compressedBuffer = await sharp(buffer)
          .jpeg({ quality })
          .toBuffer();

        quality -= 10;
      }

      return compressedBuffer;
    } catch (error) {
      console.error('Error compressing image for web:', error);
      return buffer;
    }
  }

  /**
   * Create image placeholder for missing images
   * @param {number} width - Placeholder width
   * @param {number} height - Placeholder height
   * @param {string} text - Text to display
   * @returns {Buffer} SVG placeholder buffer
   */
  static createPlaceholder(width = 300, height = 200, text = 'No Image') {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#F3F4F6"/>
        <path d="M${width/2} ${height/2 - 20}C${width/2 + 20} ${height/2 - 20} ${width/2 + 30} ${height/2 - 10} ${width/2 + 30} ${height/2}C${width/2 + 30} ${height/2 + 10} ${width/2 + 20} ${height/2 + 20} ${width/2} ${height/2 + 20}C${width/2 - 20} ${height/2 + 20} ${width/2 - 30} ${height/2 + 10} ${width/2 - 30} ${height/2}C${width/2 - 30} ${height/2 - 10} ${width/2 - 20} ${height/2 - 20} ${width/2} ${height/2 - 20}Z" fill="#9CA3AF"/>
        <text x="${width/2}" y="${height/2 + 40}" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="14">${text}</text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  /**
   * Check if file is an image based on extension and MIME type
   * @param {string} filename - File name
   * @param {string} mimetype - MIME type
   * @returns {boolean} True if image file
   */
  static isImageFile(filename, mimetype) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext) && imageMimeTypes.includes(mimetype);
  }
}

export default ImageUtils;