import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class GridFSService {
  constructor() {
    this.bucket = null;
    this.initialized = false;
    this.initializeBucket();
  }

  /**
   * Initialize GridFS bucket
   */
  initializeBucket() {
    try {
      console.log('🔧 Initializing GridFS...');
      console.log('🔗 Connection readyState:', mongoose.connection.readyState);
      console.log('🗄️ Database object:', mongoose.connection.db ? 'available' : 'NOT available');
      
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        this.bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'menu.Images'
        });
        this.initialized = true;
        console.log('✅ GridFS bucket initialized (immediate)');
        console.log('🪣 Bucket name:', this.bucket.s.options.bucketName);
      } else {
        console.log('⏳ Waiting for mongoose connection...');
        // Wait for mongoose connection
        mongoose.connection.once('connected', () => {
          this.bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'menu.Images'
          });
          this.initialized = true;
          console.log('✅ GridFS bucket initialized (deferred)');
          console.log('🪣 Bucket name:', this.bucket.s.options.bucketName);
        });
      }
    } catch (error) {
      console.error('❌ GridFS initialization error:', error);
    }
  }

  /**
   * Upload image to GridFS
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Original filename
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - GridFS file ID
   */
  async uploadImage(imageBuffer, filename, metadata = {}) {
    return new Promise((resolve, reject) => {
      if (!this.initialized || !this.bucket) {
        return reject(new Error('GridFS not initialized'));
      }

      try {
        // Generate unique filename
        const ext = path.extname(filename) || '.jpg';
        const uniqueFilename = `${crypto.randomUUID()}${ext}`;
        
        // Create upload stream
        const uploadStream = this.bucket.openUploadStream(uniqueFilename, {
          metadata: {
            originalName: filename,
            uploadDate: new Date(),
            contentType: this.getContentType(ext),
            ...metadata
          }
        });

        // Handle upload completion
        uploadStream.on('finish', () => {
          console.log(`✅ Image uploaded to GridFS: ${uploadStream.id}`);
          resolve(uploadStream.id.toString());
        });

        uploadStream.on('error', (error) => {
          console.error('❌ GridFS upload error:', error);
          reject(error);
        });

        // Write buffer to stream
        uploadStream.end(imageBuffer);

      } catch (error) {
        console.error('❌ GridFS upload error:', error);
        reject(error);
      }
    });
  }

  /**
   * Upload image from file path
   * @param {string} filePath - Path to image file
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - GridFS file ID
   */
  async uploadImageFromPath(filePath, metadata = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const imageBuffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      
      return await this.uploadImage(imageBuffer, filename, metadata);
    } catch (error) {
      console.error('❌ GridFS upload from path error:', error);
      throw error;
    }
  }

  /**
   * Upload image from URL
   * @param {string} imageUrl - Image URL
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - GridFS file ID
   */
  async uploadImageFromUrl(imageUrl, metadata = {}) {
    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MenuExtractor/1.0)'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch image: HTTP ${response.status}`);
      }

      const imageBuffer = Buffer.from(response.data);
      const filename = this.extractFilenameFromUrl(imageUrl);
      
      return await this.uploadImage(imageBuffer, filename, {
        sourceUrl: imageUrl,
        ...metadata
      });
    } catch (error) {
      console.error('❌ GridFS upload from URL error:', error);
      throw error;
    }
  }

  /**
   * Get image stream from GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Object>} - { stream, metadata }
   */
  async getImageStream(fileId) {
    try {
      if (!this.initialized || !this.bucket) {
        throw new Error('GridFS not initialized');
      }

      console.log('🔍 Looking for GridFS image with ID:', fileId);
      console.log('🪣 Bucket name:', this.bucket?.s?.options?.bucketName || 'unknown');
      
      const objectId = new mongoose.Types.ObjectId(fileId);
      console.log('🔑 ObjectId:', objectId);
      console.log('🔑 ObjectId string:', objectId.toString());
      console.log('🔑 ObjectId type:', typeof objectId);
      console.log('🗄️ DB name:', this.bucket.s.db.databaseName);
      console.log('🪣 Bucket name:', this.bucket.s.options.bucketName);
      
      // Get file metadata
      console.log('🔍 Querying bucket.find({ _id: objectId })...');
      const files = await this.bucket.find({ _id: objectId }).toArray();
      console.log('📁 Files found:', files.length);
      
      if (files.length === 0) {
        // Try alternate query to debug
        console.log('🔍 Trying to list all files in bucket...');
        const allFiles = await this.bucket.find().limit(3).toArray();
        console.log('📁 Sample files in bucket:', allFiles.length);
        if (allFiles.length > 0) {
          console.log('   First file ID:', allFiles[0]._id.toString());
          console.log('   First file name:', allFiles[0].filename);
        }
      }
      
      if (files.length === 0) {
        console.error('❌ No files found with ObjectId:', objectId.toString());
        throw new Error('Image not found');
      }

      const file = files[0];
      const downloadStream = this.bucket.openDownloadStream(objectId);
      
      return {
        stream: downloadStream,
        metadata: {
          filename: file.filename,
          contentType: file.metadata?.contentType || 'image/jpeg',
          length: file.length,
          uploadDate: file.uploadDate,
          originalName: file.metadata?.originalName
        }
      };
    } catch (error) {
      console.error('❌ GridFS download error:', error);
      throw error;
    }
  }

  /**
   * Get image as buffer
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Buffer>} - Image buffer
   */
  async getImageBuffer(fileId) {
    try {
      const { stream } = await this.getImageStream(fileId);
      
      return new Promise((resolve, reject) => {
        const chunks = [];
        
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ GridFS buffer error:', error);
      throw error;
    }
  }

  /**
   * Delete image from GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteImage(fileId) {
    try {
      if (!this.initialized || !this.bucket) {
        throw new Error('GridFS not initialized');
      }

      const objectId = new mongoose.Types.ObjectId(fileId);
      await this.bucket.delete(objectId);
      
      console.log(`✅ Image deleted from GridFS: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ GridFS delete error:', error);
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
      if (!this.initialized || !this.bucket) {
        throw new Error('GridFS not initialized');
      }

      const { limit = 20, skip = 0, sortBy = 'uploadDate', sortOrder = -1 } = options;
      
      const files = await this.bucket
        .find({})
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      return files.map(file => ({
        id: file._id.toString(),
        filename: file.filename,
        originalName: file.metadata?.originalName,
        contentType: file.metadata?.contentType,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
      }));
    } catch (error) {
      console.error('❌ GridFS list error:', error);
      throw error;
    }
  }

  /**
   * Check if image exists
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<boolean>} - Exists status
   */
  async imageExists(fileId) {
    try {
      if (!this.initialized || !this.bucket) {
        return false;
      }

      const objectId = new mongoose.Types.ObjectId(fileId);
      const files = await this.bucket.find({ _id: objectId }).toArray();
      
      return files.length > 0;
    } catch (error) {
      console.error('❌ GridFS exists check error:', error);
      return false;
    }
  }

  /**
   * Get content type from file extension
   * @param {string} ext - File extension
   * @returns {string} - Content type
   */
  getContentType(ext) {
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml'
    };
    
    return contentTypes[ext.toLowerCase()] || 'image/jpeg';
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
   * Get GridFS stats
   * @returns {Promise<Object>} - GridFS statistics
   */
  async getStats() {
    try {
      if (!this.initialized || !this.bucket) {
        throw new Error('GridFS not initialized');
      }

      const files = await this.bucket.find({}).toArray();
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.length, 0);
      
      return {
        totalFiles,
        totalSize,
        averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
        oldestFile: files.length > 0 ? Math.min(...files.map(f => f.uploadDate)) : null,
        newestFile: files.length > 0 ? Math.max(...files.map(f => f.uploadDate)) : null
      };
    } catch (error) {
      console.error('❌ GridFS stats error:', error);
      throw error;
    }
  }
}

export default new GridFSService();
