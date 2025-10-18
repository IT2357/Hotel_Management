import Menu from '../models/Menu.js';
import ocrService from '../services/ocrService.js';
import htmlParser from '../services/htmlParser.js';
import imageStorageService from '../services/imageStorageService.js';
import aiImageAnalysisService from '../services/aiImageAnalysisService.js';
import AIJaffnaTrainer from '../services/aiJaffnaTrainer.js';
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
    console.log('🔍 Raw body fields:', Object.keys(req.body || {}));
    console.log('🔍 Raw body values:', req.body);
    console.log('🔍 Files object:', req.files ? Object.keys(req.files) : 'none');
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`🔍 Files in '${key}':`, req.files[key].length, 'files');
      });
    }

    // Check for uploaded file (either from req.file or req.files)
    const hasFile = !!(req.file || (req.files && ((Array.isArray(req.files) && req.files.length > 0) || Object.keys(req.files).length > 0)));
    const hasUrl = req.body.url && req.body.url.trim();
    const hasPath = req.body.path && req.body.path.trim();

    console.log('🔍 Input type detection - File:', hasFile, 'URL:', !!hasUrl, 'Path:', !!hasPath);
    console.log('🔍 req.file present:', !!req.file, 'req.files present:', !!req.files);

    if (req.file) {
      console.log('✅ Using req.file - GridFS ID:', req.file.gridfsId);
    }

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
      console.log('🔍 req.file.gridfsId:', req.file.gridfsId);
      extractionData.source = { type: 'image', value: req.file.originalname };
      extractionData.imageId = req.file.gridfsId; // Store GridFS file ID as string
      console.log('🔍 extractionData.imageId set to:', extractionData.imageId);
      
      try {
        // For GridFS files, we need to read the buffer from GridFS
        // Since multer-gridfs-storage doesn't provide buffer, we'll use the file path or create a simple OCR result
        let ocrResult;
        
        // Enhanced Jaffna-Trained OCR Analysis
        console.log('🤖 AI: Analyzing food image with Jaffna-trained OCR...');
        try {
          // Use the image buffer directly from the uploaded file
          const fileBuffer = req.file.buffer;

          if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('Empty or null file buffer from upload');
          }

          // Initialize Jaffna trainer
          const jaffnaTrainer = new AIJaffnaTrainer();
          await jaffnaTrainer.initializeWorker();

          // Create temporary file for OCR processing
          const tempFilePath = `/tmp/menu_${Date.now()}.jpg`;
          fs.writeFileSync(tempFilePath, fileBuffer);

          // Use Jaffna-trained OCR for better Tamil/English extraction
          console.log('🤖 Processing with Jaffna-trained OCR...');
          const ocrResult = await jaffnaTrainer.trainOnImage(tempFilePath, null);
          
          if (ocrResult.success && ocrResult.extractedData) {
            console.log(`✅ Jaffna OCR successful (confidence: ${Math.round(ocrResult.confidence * 100)}%)`);
            
            // Use the parsed menu data from Jaffna trainer
            const menuData = ocrResult.extractedData;
            
            extractionData.categories = menuData.categories;
            extractionData.rawText = `Jaffna OCR: ${menuData.totalItems} food items detected with Tamil/English support`;
            extractionData.extractionMethod = 'jaffna-trained-ocr';
            extractionData.confidence = Math.round(ocrResult.confidence * 100);
            extractionData.aiAnalysis = {
              method: 'jaffna-trained-ocr',
              confidence: ocrResult.confidence,
              tamilSupport: true,
              jaffnaDishes: menuData.totalItems
            };
            
            console.log(`🍽️ Generated ${menuData.totalItems} menu items across ${menuData.categories.length} categories`);
          } else {
            // Fallback to generic AI analysis
            console.log('📝 FALLBACK: Using generic AI analysis...');
            const detailLevel = req.body.detailLevel || 'standard';
            const aiAnalysis = await aiImageAnalysisService.analyzeFoodImage(fileBuffer, req.file.mimetype, req.file.originalname, { detailLevel });
            
            if (aiAnalysis.success) {
              const menuData = aiImageAnalysisService.convertToMenuFormat(aiAnalysis, extractionData.imageId);
              extractionData.categories = menuData.categories;
              extractionData.rawText = `Generic AI: ${menuData.totalItems} food items detected`;
              extractionData.extractionMethod = 'generic-ai-fallback';
              extractionData.confidence = aiAnalysis.confidence;
            } else {
              throw new Error('Both Jaffna OCR and generic AI failed');
            }
          }

          // Cleanup temporary file
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }

          // Cleanup trainer
          await jaffnaTrainer.cleanup();

        } catch (analysisError) {
          console.error('❌ Jaffna OCR Analysis error:', analysisError);
          console.error('❌ Error stack:', analysisError.stack);
          // Final fallback to basic structure
          console.log('📝 FINAL FALLBACK: Using basic menu structure');
          extractionData.categories = [{
            name: "Detected Items",
            items: [{
              name: "Food Item from Image",
              price: 200,
              description: "Food item detected in uploaded image - please review and edit",
              image: null,
              isVeg: false,
              isSpicy: false,
              confidence: 30
            }],
            description: "Items detected from uploaded image"
          }];
          extractionData.rawText = "OCR analysis failed - using fallback detection";
          extractionData.extractionMethod = "ocr-fallback";
          extractionData.confidence = 30;
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
        // Special handling for Google Images URLs
        let processedUrl = url;
        if (url.includes('google.com') && (url.includes('imgurl=') || url.includes('imgres'))) {
          console.log('🔍 Detected Google Images URL, extracting actual image URL...');
          try {
            // Extract the actual image URL from Google Images parameters
            const urlObj = new URL(url);
            const imgUrl = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('imgres');
            if (imgUrl) {
              processedUrl = decodeURIComponent(imgUrl);
              console.log('✅ Extracted actual image URL:', processedUrl);
            }
          } catch (googleUrlError) {
            console.warn('⚠️ Failed to extract URL from Google Images link:', googleUrlError.message);
          }
        }

        // Check if URL is an image URL
        const urlIsImage = await isImageUrl(processedUrl);

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

          // Use Jaffna-trained OCR for URL images
          console.log('🤖 Analyzing food image from URL with Jaffna-trained OCR...');
          try {
            // Initialize Jaffna trainer
            const jaffnaTrainer = new AIJaffnaTrainer();
            await jaffnaTrainer.initializeWorker();

            // Create temporary file for OCR processing
            const tempFilePath = `/tmp/url_menu_${Date.now()}.jpg`;
            fs.writeFileSync(tempFilePath, imageBuffer);

            // Use Jaffna-trained OCR
            const ocrResult = await jaffnaTrainer.trainOnImage(tempFilePath, null);
            
            if (ocrResult.success && ocrResult.extractedData) {
              console.log(`✅ Jaffna OCR successful (confidence: ${Math.round(ocrResult.confidence * 100)}%)`);
              
              // Use the parsed menu data from Jaffna trainer
              const menuData = ocrResult.extractedData;
              
              extractionData.categories = menuData.categories;
              extractionData.rawText = `Jaffna OCR: ${menuData.totalItems} food items detected with Tamil/English support`;
              extractionData.extractionMethod = 'jaffna-trained-ocr-url';
              extractionData.confidence = Math.round(ocrResult.confidence * 100);
              extractionData.aiAnalysis = {
                method: 'jaffna-trained-ocr-url',
                confidence: ocrResult.confidence,
                tamilSupport: true,
                jaffnaDishes: menuData.totalItems
              };
              
              console.log(`🍽️ Generated ${menuData.totalItems} menu items across ${menuData.categories.length} categories`);
            } else {
              // Fallback to generic AI analysis
              console.log('📝 FALLBACK: Using generic AI analysis for URL...');
              const detailLevel = req.body.detailLevel || 'standard';
              const aiAnalysis = await aiImageAnalysisService.analyzeFoodImage(imageBuffer, contentType, url, { detailLevel });

              if (aiAnalysis.success) {
                console.log(`✅ Generic AI Analysis successful with ${aiAnalysis.method} (confidence: ${aiAnalysis.confidence}%)`);

                // Convert AI analysis to menu format
                const menuData = aiImageAnalysisService.convertToMenuFormat(aiAnalysis, extractionData.imageId);

                extractionData.categories = menuData.categories;
                extractionData.rawText = `Generic AI: ${menuData.totalItems} food items detected using ${aiAnalysis.method}`;
                extractionData.extractionMethod = 'generic-ai-url-fallback';
                extractionData.confidence = aiAnalysis.confidence;
                extractionData.aiAnalysis = aiAnalysis.data;

                console.log(`🍽️ Generated ${menuData.totalItems} menu items across ${menuData.categories.length} categories`);
              } else {
                throw new Error('Both Jaffna OCR and generic AI failed for URL');
              }
            }

            // Cleanup temporary file
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }

            // Cleanup trainer
            await jaffnaTrainer.cleanup();

          } catch (urlAnalysisError) {
            console.error('❌ URL Jaffna OCR Analysis error:', urlAnalysisError);
            // Final fallback for URL
            extractionData.categories = [{
              name: "Detected Items",
              items: [{
                name: "Food Item from URL",
                price: 200,
                description: "Food item detected from URL image - please review and edit",
                image: null,
                isVeg: false,
                isSpicy: false,
                confidence: 25
              }],
              description: "Items detected from URL image"
            }];
            extractionData.rawText = "URL OCR analysis failed - using fallback detection";
            extractionData.extractionMethod = "url-ocr-fallback";
            extractionData.confidence = 25;
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
    console.log('🔍 DEBUG: extractionData.imageId before save:', extractionData.imageId);
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
    console.log('🔍 DEBUG: menuData.imageId:', menuData.imageId);

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

    // Set CORS headers to allow cross-origin image requests
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

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

      // Set response headers with CORS
      res.set({
        'Content-Type': metadata.contentType,
        'Content-Length': metadata.length,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': imageId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length, ETag'
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
