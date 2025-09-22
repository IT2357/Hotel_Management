import Menu from '../models/Menu.js';
import ocrService from '../services/ocrService.js';
import htmlParser from '../services/htmlParser.js';
import imageStorageService from '../services/imageStorageService.js';
import aiImageAnalysisService from '../services/aiImageAnalysisService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if a URL points to an image
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} - True if URL is an image
 */
async function isImageUrl(url) {
  console.log('🔍 Checking if URL is image:', url);
  try {
    // Check file extension first
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const urlLower = url.toLowerCase();

    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      console.log('✅ URL has image extension');
      return true;
    }

    // Check for Google image redirect URLs
    if (url.includes('google.com/url') && url.includes('source=images')) {
      console.log('🔍 Detected Google image redirect URL, following redirect...');
      try {
        // Follow the redirect to get the actual image URL
        const redirectResponse = await axios.get(url, {
          maxRedirects: 5,
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Check if the final URL has image extension
        const finalUrl = redirectResponse.request.res.responseUrl || redirectResponse.config.url;
        console.log('🔍 Google redirect final URL:', finalUrl);
        if (imageExtensions.some(ext => finalUrl.toLowerCase().includes(ext))) {
          console.log('✅ Google redirect leads to image URL:', finalUrl);
          return true;
        }

        // Check content-type of final response
        const contentType = redirectResponse.headers['content-type'];
        console.log('🔍 Google redirect content-type:', contentType);
        if (contentType && contentType.startsWith('image/')) {
          console.log('✅ Google redirect leads to image content-type:', contentType);
          return true;
        }
      } catch (redirectError) {
        console.warn('⚠️ Failed to follow Google redirect:', redirectError.message);
      }
    }

    // Check content-type via HEAD request for other URLs
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers['content-type'];
    return contentType && contentType.startsWith('image/');

  } catch (error) {
    console.warn('⚠️ Could not determine if URL is image:', error.message);
    // Fallback: assume it's not an image if we can't check
    return false;
  }
}

/**
 * Extract menu from image upload, local path, or URL
 * POST /api/menu/extract
 */
export const extractMenu = async (req, res) => {
  try {
    console.log('🔄 Starting menu extraction...');
    console.log('🔍 User authenticated:', !!req.user, 'Role:', req.user?.role);
    console.log('🔍 Input type detection - File:', !!req.file, 'URL:', !!req.body.url, 'Path:', !!req.body.path);

    let extractionData = {
      source: { type: '', value: '' },
      categories: [],
      rawText: '',
      extractionMethod: '',
      confidence: 0,
      imageId: null
    };

    // Determine input type and process accordingly
    // Input type detection

    if (req.file) {
      // Image upload - file is already stored in GridFS by our middleware
      console.log('📸 Processing uploaded image...');
      extractionData.source = { type: 'image', value: req.file.originalname };
      extractionData.imageId = req.file.gridfsId; // Store GridFS file ID
      
      try {
        // For GridFS files, we need to read the buffer from GridFS
        // Since multer-gridfs-storage doesn't provide buffer, we'll use the file path or create a simple OCR result
        let ocrResult;
        
        // Enhanced AI Food Analysis like Google Lens
        console.log('🤖 AI: Analyzing food image with advanced computer vision...');
        try {
          // Import the gridfsService to read the file
          const gridfsService = (await import('../services/gridfsService.js')).default;

          // Get the file buffer from GridFS
          const fileBuffer = await gridfsService.getImageBuffer(req.file.gridfsId);

          if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('Empty or null file buffer from GridFS');
          }

          // Use AI Image Analysis Service (like Google Lens)
          console.log('🤖 Analyzing food image with AI...');
          const aiAnalysis = await aiImageAnalysisService.analyzeFoodImage(fileBuffer, req.file.mimetype, req.file.originalname);
          
          if (aiAnalysis.success) {
            console.log(`✅ AI Analysis successful with ${aiAnalysis.method} (confidence: ${aiAnalysis.confidence}%)`);
            
            // Convert AI analysis to menu format
            const menuData = aiImageAnalysisService.convertToMenuFormat(aiAnalysis);
            
            extractionData.categories = menuData.categories;
            extractionData.rawText = `AI Analysis: ${menuData.totalItems} food items detected using ${aiAnalysis.method}`;
            extractionData.extractionMethod = aiAnalysis.method; // Use the method directly from AI analysis
            extractionData.confidence = aiAnalysis.confidence;
            extractionData.aiAnalysis = aiAnalysis.data;
            
            console.log(`🍽️ Generated ${menuData.totalItems} menu items across ${menuData.categories.length} categories`);
          } else {
            throw new Error('AI analysis failed');
          }

        } catch (analysisError) {
          console.error('❌ AI Analysis error:', analysisError);
          console.error('❌ Error stack:', analysisError.stack);
          // Fallback to basic structure if AI analysis fails
          console.log('📝 FALLBACK: Using basic menu structure due to AI analysis failure');
          extractionData.categories = [{
            name: "Detected Items",
            items: [{
              name: "Food Item from Image",
              price: 200,
              description: "Food item detected in uploaded image - please review and edit",
              image: null,
              isVeg: false,
              isSpicy: false,
              confidence: 50
            }],
            description: "Items detected from uploaded image"
          }];
          extractionData.rawText = "AI analysis failed - using fallback detection";
          extractionData.extractionMethod = "ai-vision-fallback";
          extractionData.confidence = 50;
        }

        // Add image reference to items using GridFS ID
        if (extractionData.categories.length > 0 && extractionData.imageId) {
          extractionData.categories.forEach(category => {
            category.items.forEach(item => {
              if (!item.image) {
                item.image = `/api/menu/image/${extractionData.imageId}`;
              }
            });
          });
        }

      } catch (imageProcessingError) {
        console.error('❌ Image processing failed:', imageProcessingError);
        // Provide fallback: create basic menu structure
        extractionData.rawText = 'Image processing failed';
        extractionData.extractionMethod = 'failed';
        extractionData.confidence = 0;
        extractionData.categories = [{
          name: "Detected Items",
          items: [{
            name: "Food Item from Image",
            price: 200,
            description: "Image processing failed - please review and edit",
            image: null,
            isVeg: false,
            isSpicy: false
          }]
        }];
      }
      
    } else if (req.body.path) {
      // Local file path
      console.log('📁 Processing local file path...');
      const filePath = req.body.path;
      extractionData.source = { type: 'path', value: filePath };
      
      try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(400).json({
            success: false,
            message: 'File not found at specified path'
          });
        }
        
        // Extract text using OCR
        const ocrResult = await ocrService.extractText(filePath);
        extractionData.rawText = ocrResult.text;
        extractionData.extractionMethod = ocrResult.method;
        extractionData.confidence = ocrResult.confidence;
        
        // Parse text into menu structure
        extractionData.categories = ocrService.parseMenuText(ocrResult.text);
        extractionData.categories = ocrService.validateMenuStructure(extractionData.categories);
        
        // Store image
        if (extractionData.categories.length > 0) {
          try {
            const imageId = await imageStorageService.uploadImageFromPath(filePath, {
              menuExtraction: true,
              sourcePath: filePath
            });

            extractionData.categories.forEach(category => {
              category.items.forEach(item => {
                if (!item.image) {
                  item.image = imageId;
                }
              });
            });
          } catch (imageError) {
            console.warn('⚠️ Failed to store image:', imageError.message);
          }
        }
        
      } catch (error) {
        console.error('❌ File processing failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to process file',
          error: error.message
        });
      }
      
    } else if (req.body.url) {
      // URL extraction
      const url = req.body.url;
      console.log('🌐 Processing URL:', url);
      extractionData.source = { type: 'url', value: url };

      try {
        // Check if URL is an image URL
        const urlIsImage = await isImageUrl(url);

        if (urlIsImage) {
          console.log('🖼️ Detected image URL, processing as image upload...');

          // Download image from URL
          const axios = (await import('axios')).default;
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const imageBuffer = Buffer.from(response.data);
          const contentType = response.headers['content-type'] || 'image/jpeg';

          // Store the downloaded image in our storage system
          console.log('💾 Storing downloaded image...');
          try {
            const filename = `url-image-${Date.now()}.jpg`;
            const storedImageId = await imageStorageService.uploadImage(imageBuffer, filename, {
              contentType: contentType,
              menuExtraction: true,
              sourceUrl: url
            });
            extractionData.imageId = storedImageId;
            console.log(`✅ Image stored with ID: ${storedImageId}`);
          } catch (storageError) {
            console.error('❌ Image storage failed:', storageError);
            // Continue with AI analysis even if storage fails
            extractionData.imageId = null;
          }

          // Use AI Image Analysis Service (same as file upload)
          console.log('🤖 Analyzing food image from URL with AI...');
          const aiAnalysis = await aiImageAnalysisService.analyzeFoodImage(imageBuffer, contentType, url);

          if (aiAnalysis.success) {
            console.log(`✅ AI Analysis successful with ${aiAnalysis.method} (confidence: ${aiAnalysis.confidence}%)`);

            // Convert AI analysis to menu format
            const menuData = aiImageAnalysisService.convertToMenuFormat(aiAnalysis);

            extractionData.categories = menuData.categories;
            extractionData.rawText = `AI Analysis: ${menuData.totalItems} food items detected using ${aiAnalysis.method}`;
            extractionData.extractionMethod = aiAnalysis.method;
            extractionData.confidence = aiAnalysis.confidence;
            extractionData.aiAnalysis = aiAnalysis.data;

            console.log(`🍽️ Generated ${menuData.totalItems} menu items across ${menuData.categories.length} categories`);
          } else {
            throw new Error('AI analysis failed for image URL');
          }

          // Add image reference to items using stored image ID
          if (extractionData.categories.length > 0 && extractionData.imageId) {
            console.log(`🖼️ Assigning stored image ${extractionData.imageId} to menu items...`);
            extractionData.categories.forEach(category => {
              category.items.forEach(item => {
                if (!item.image) {
                  item.image = `/api/menu/image/${extractionData.imageId}`;
                  console.log(`✅ Assigned image to item: ${item.name}`);
                }
              });
            });
          } else {
            console.log('⚠️ No image stored or no categories to assign images to');
          }

        } else {
          // Extract menu from webpage (original logic)
          console.log('🌐 Processing as webpage URL...');
          const htmlResult = await htmlParser.extractMenuFromURL(url);
          extractionData.rawText = htmlResult.rawText;
          extractionData.extractionMethod = htmlResult.method;
          extractionData.confidence = htmlResult.confidence;
          extractionData.categories = htmlResult.categories;

          // Validate structure
          extractionData.categories = ocrService.validateMenuStructure(extractionData.categories);
        }

      } catch (error) {
        console.error('❌ URL processing failed:', error);
        // Provide fallback: create empty menu structure
        extractionData.rawText = 'URL processing failed';
        extractionData.extractionMethod = 'failed';
        extractionData.confidence = 0;
        extractionData.categories = [];
        extractionData.processingStatus = 'failed';
      }
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid input provided. Please upload an image, provide a file path, or specify a URL.'
      });
    }

    // Create menu document
    const menuData = {
      source: extractionData.source,
      categories: extractionData.categories,
      rawText: extractionData.rawText,
      extractionMethod: extractionData.extractionMethod,
      confidence: extractionData.confidence,
      processingStatus: extractionData.processingStatus || (extractionData.categories.length > 0 ? 'completed' : 'failed'),
      createdBy: req.user?.id || null,
      imageId: extractionData.imageId // Store GridFS file ID
    };

    // Save to database
    let savedMenu;
    try {
      const menu = new Menu(menuData);
      savedMenu = await menu.save();

      console.log(`✅ Menu extraction completed. Found ${savedMenu.totalCategories} categories with ${savedMenu.totalItems} items.`);
    } catch (saveError) {
      console.error('Menu save error:', saveError);
      if (saveError.errors) {
        console.error('Validation errors:', saveError.errors);
      }
      throw saveError;
    }

    const responseData = {
      success: true,
      menu: savedMenu.toAPIResponse(),
      previewId: savedMenu._id.toString(),
      message: `Successfully extracted ${savedMenu.totalItems} menu items from ${savedMenu.totalCategories} categories`
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Menu extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during menu extraction',
      error: error.message
    });
  }
};

/**
 * Get menu preview by ID
 * GET /api/menu/preview/:id
 */
export const getMenuPreview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      menu: menu.toAPIResponse()
    });

  } catch (error) {
    console.error('❌ Get menu preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu preview',
      error: error.message
    });
  }
};

/**
 * Save edited menu to database
 * POST /api/menu/save
 */
export const saveMenu = async (req, res) => {
  try {
    const menuData = req.body;
    
    // Validate menu structure
    const validationErrors = Menu.validateMenuStructure(menuData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu structure',
        errors: validationErrors
      });
    }

    // Add metadata
    menuData.createdBy = req.user?.id || null;
    menuData.processingStatus = 'completed';

    // Create and save menu
    const menu = new Menu(menuData);
    const savedMenu = await menu.save();

    console.log(`✅ Menu saved successfully: ${savedMenu._id}`);

    res.status(201).json({
      success: true,
      insertedId: savedMenu._id.toString(),
      menu: savedMenu.toAPIResponse(),
      message: 'Menu saved successfully'
    });

  } catch (error) {
    console.error('❌ Save menu error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save menu',
      error: error.message
    });
  }
};

/**
 * Get saved menu by ID
 * GET /api/menu/:id
 */
export const getMenu = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      menu: menu.toAPIResponse()
    });

  } catch (error) {
    console.error('❌ Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
      error: error.message
    });
  }
};

/**
 * Get image from storage
 * GET /api/menu/image/:imageId
 */
export const getMenuImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    // Check if image exists
    const exists = await imageStorageService.imageExists(imageId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Get image based on storage provider
    const imageData = await imageStorageService.getImage(imageId);

    if (typeof imageData === 'string') {
      // Cloudinary URL - redirect to the URL
      res.redirect(imageData);
    } else {
      // GridFS stream - pipe to response
      const { stream, metadata } = imageData;

      // Set response headers
      res.set({
        'Content-Type': metadata.contentType,
        'Content-Length': metadata.length,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': imageId
      });

      // Stream image to response
      stream.pipe(res);
    }

  } catch (error) {
    console.error('❌ Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image',
      error: error.message
    });
  }
};

/**
 * List all menus with pagination
 * GET /api/menu
 */
export const listMenus = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      source, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (req.user?.id) {
      filter.createdBy = req.user.id;
    }
    if (source) {
      filter['source.type'] = source;
    }
    if (status) {
      filter.processingStatus = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const menus = await Menu.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-rawText'); // Exclude large text field for list view

    const total = await Menu.countDocuments(filter);

    res.status(200).json({
      success: true,
      menus: menus.map(menu => menu.toAPIResponse()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ List menus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menus',
      error: error.message
    });
  }
};

/**
 * Delete menu by ID
 * DELETE /api/menu/:id
 */
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check ownership
    if (req.user?.id && menu.createdBy && menu.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete associated images
    try {
      for (const category of menu.categories) {
        for (const item of category.items) {
          if (item.image) {
            await imageStorageService.deleteImage(item.image);
          }
        }
      }
    } catch (imageError) {
      console.warn('⚠️ Failed to delete some images:', imageError.message);
    }

    // Delete menu document
    await Menu.findByIdAndDelete(id);

    console.log(`✅ Menu deleted successfully: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu',
      error: error.message
    });
  }
};

/**
 * Get extraction statistics
 * GET /api/menu/stats
 */
export const getExtractionStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.id) {
      filter.createdBy = req.user.id;
    }

    const stats = await Menu.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMenus: { $sum: 1 },
          totalItems: { $sum: { $size: { $reduce: { input: '$categories', initialValue: [], in: { $concatArrays: ['$$value', '$$this.items'] } } } } },
          totalCategories: { $sum: { $size: '$categories' } },
          avgConfidence: { $avg: '$confidence' },
          bySource: {
            $push: {
              source: '$source.type',
              count: 1
            }
          },
          byMethod: {
            $push: {
              method: '$extractionMethod',
              count: 1
            }
          }
        }
      }
    ]);

    const storageStats = await imageStorageService.getStats();

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalMenus: 0,
        totalItems: 0,
        totalCategories: 0,
        avgConfidence: 0,
        bySource: [],
        byMethod: []
      },
      storageStats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
