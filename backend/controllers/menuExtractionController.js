import Menu from '../models/Menu.js';
import ocrService from '../services/ocrService.js';
import htmlParser from '../services/htmlParser.js';
import imageStorageService from '../services/imageStorageService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract menu from image upload, local path, or URL
 * POST /api/menu/extract
 */
export const extractMenu = async (req, res) => {
  try {
    console.log('🔄 Starting menu extraction...');
    console.log('🔍 VALIDATION: Request headers:', req.headers);
    console.log('🔍 VALIDATION: User authenticated:', !!req.user);
    console.log('🔍 VALIDATION: User role:', req.user?.role);
    console.log('🔍 VALIDATION: User ID:', req.user?.id);
    console.log('🔍 VALIDATION: Request body keys:', Object.keys(req.body || {}));
    console.log('🔍 VALIDATION: Request body:', req.body);
    console.log('🔍 VALIDATION: Has file:', !!req.file);
    console.log('🔍 VALIDATION: File details:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    let extractionData = {
      source: { type: '', value: '' },
      categories: [],
      rawText: '',
      extractionMethod: '',
      confidence: 0
    };

    // Determine input type and process accordingly
    if (req.file) {
      // Image upload
      console.log('📸 Processing uploaded image...');
      extractionData.source = { type: 'image', value: req.file.originalname };
      
      try {
        // Extract text using OCR
        const ocrResult = await ocrService.extractText(req.file.buffer);
        extractionData.rawText = ocrResult.text;
        extractionData.extractionMethod = ocrResult.method;
        extractionData.confidence = ocrResult.confidence;

        // Parse text into menu structure
        extractionData.categories = ocrService.parseMenuText(ocrResult.text);

        // Validate and enhance structure
        extractionData.categories = ocrService.validateMenuStructure(extractionData.categories);

        // Store image if categories were found
        if (extractionData.categories.length > 0) {
          try {
            const imageId = await imageStorageService.uploadImage(
              req.file.buffer,
              req.file.originalname,
              {
                menuExtraction: true,
                originalSize: req.file.size,
                mimeType: req.file.mimetype
              }
            );

            // Add image reference to items (optional)
            extractionData.categories.forEach(category => {
              category.items.forEach(item => {
                if (!item.image) {
                  item.image = imageId;
                }
              });
            });
          } catch (imageError) {
            console.warn('⚠️ Failed to store image:', imageError.message);
            // Continue without image storage
          }
        }

      } catch (ocrError) {
        console.error('❌ OCR processing failed:', ocrError);
        // Provide fallback: create empty menu structure
        extractionData.rawText = 'OCR processing failed';
        extractionData.extractionMethod = 'failed';
        extractionData.confidence = 0;
        extractionData.categories = [];
        extractionData.processingStatus = 'failed';
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
      console.log('🌐 Processing URL...');
      const url = req.body.url;
      extractionData.source = { type: 'url', value: url };
      
      try {
        // Extract menu from webpage
        const htmlResult = await htmlParser.extractMenuFromURL(url);
        extractionData.rawText = htmlResult.rawText;
        extractionData.extractionMethod = htmlResult.method;
        extractionData.confidence = htmlResult.confidence;
        extractionData.categories = htmlResult.categories;

        // Validate structure
        extractionData.categories = ocrService.validateMenuStructure(extractionData.categories);

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
      createdBy: req.user?.id || null
    };

    // Save to database
    const menu = new Menu(menuData);
    const savedMenu = await menu.save();

    console.log(`✅ Menu extraction completed. Found ${savedMenu.totalCategories} categories with ${savedMenu.totalItems} items.`);

    res.status(200).json({
      success: true,
      menu: savedMenu.toAPIResponse(),
      previewId: savedMenu._id.toString(),
      message: `Successfully extracted ${savedMenu.totalItems} menu items from ${savedMenu.totalCategories} categories`
    });

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
