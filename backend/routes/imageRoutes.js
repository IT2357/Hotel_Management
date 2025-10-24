/**
 * Image Serving Routes
 * Serves images from GridFS or Cloudinary storage
 */

import express from 'express';
import imageStorageService from '../services/imageStorageService.js';

const router = express.Router();

/**
 * @route   GET /api/images/:imageId
 * @desc    Get image by ID (from GridFS or Cloudinary)
 * @access  Public
 */
router.get('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    console.log(`📷 Fetching image: ${imageId}`);

    // Parse provider and ID
    const [provider, id] = imageStorageService.parseImageId(imageId);
    
    if (provider === 'cloudinary') {
      // For Cloudinary, redirect to the CDN URL
      const cloudinaryService = imageStorageService.services.cloudinary;
      const imageUrl = cloudinaryService.getImageUrl(id);
      return res.redirect(imageUrl);
    } 
    
    if (provider === 'gridfs') {
      // For GridFS, stream the image
      const gridfsService = imageStorageService.services.gridfs;
      const { stream, metadata } = await gridfsService.getImageStream(id);
      
      // Set appropriate headers
      res.set('Content-Type', metadata.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Pipe the stream to response
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('❌ Error streaming image:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming image'
          });
        }
      });
      
      return;
    }
    
    // Unknown provider
    res.status(400).json({
      success: false,
      message: `Unsupported storage provider: ${provider}`
    });
    
  } catch (error) {
    console.error('❌ Error fetching image:', error);
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching image',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/images/:imageId
 * @desc    Delete image by ID
 * @access  Private/Admin
 */
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    console.log(`🗑️ Deleting image: ${imageId}`);
    
    const deleted = await imageStorageService.deleteImage(imageId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

export default router;

