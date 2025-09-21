import express from 'express';
import multer from 'multer';
import {
  extractMenu,
  getMenuPreview,
  saveMenu,
  getMenu,
  getMenuImage,
  listMenus,
  deleteMenu,
  getExtractionStats
} from '../controllers/menuExtractionController.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'), false);
    }
  }
});

// Handle multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 15MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Routes

/**
 * @route   POST /api/menu/extract
 * @desc    Extract menu from image upload, local path, or URL
 * @access  Protected (Admin/Manager)
 * @body    FormData with file OR JSON with { path: "..." } OR { url: "..." }
 */
router.post('/extract', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  upload.single('file'), 
  handleMulterError, 
  extractMenu
);

/**
 * @route   GET /api/menu/preview/:id
 * @desc    Get menu preview for admin review
 * @access  Protected (Admin/Manager)
 */
router.get('/preview/:id', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  getMenuPreview
);

/**
 * @route   POST /api/menu/save
 * @desc    Save edited menu to database
 * @access  Protected (Admin/Manager)
 * @body    { source: {...}, categories: [...], rawText: "..." }
 */
router.post('/save', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  saveMenu
);

/**
 * @route   GET /api/menu/:id
 * @desc    Get saved menu by ID
 * @access  Protected (Admin/Manager)
 */
router.get('/:id', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  getMenu
);

/**
 * @route   GET /api/menu/image/:imageId
 * @desc    Get image from storage (GridFS or Cloudinary)
 * @access  Public (for displaying images)
 */
router.get('/image/:imageId', getMenuImage);

/**
 * @route   GET /api/menu
 * @desc    List all menus with pagination and filters
 * @access  Protected (Admin/Manager)
 * @query   page, limit, source, status, sortBy, sortOrder
 */
router.get('/', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  listMenus
);

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete menu by ID
 * @access  Protected (Admin/Manager)
 */
router.delete('/:id', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  deleteMenu
);

/**
 * @route   GET /api/menu/stats
 * @desc    Get extraction statistics
 * @access  Protected (Admin/Manager)
 */
router.get('/stats', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  getExtractionStats
);

export default router;
