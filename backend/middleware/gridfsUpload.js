import multer from 'multer';
import gridfsService from '../services/gridfsService.js';

// Configure multer for memory storage (we'll handle GridFS manually)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|avif/;
  const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, WEBP, GIF, AVIF)'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit as per README
    files: 1 // Only allow 1 file at a time
  },
  fileFilter: fileFilter
});

// Middleware to handle GridFS upload after multer processes the file
export const uploadToGridFS = async (req, res, next) => {
  try {
    if (req.file) {
      console.log('📁 Uploading file to GridFS:', req.file.originalname);
      
      // Upload to GridFS using our service
      const fileId = await gridfsService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        {
          uploadedBy: req.user?.id,
          purpose: 'menu_extraction',
          originalSize: req.file.size,
          mimeType: req.file.mimetype
        }
      );

      // Add GridFS file ID to request object
      req.file.id = fileId;
      req.file.gridfsId = fileId;
      
      console.log('✅ File uploaded to GridFS with ID:', fileId);
    }
    
    next();
  } catch (error) {
    console.error('❌ GridFS upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image to storage',
      error: error.message
    });
  }
};

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size allowed is 15MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file is allowed.',
        error: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use "file" as the field name.',
        error: 'UNEXPECTED_FILE_FIELD'
      });
    }
  }

  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  // For other errors, pass to next middleware
  next(error);
};

// Single file upload middleware
export const uploadSingle = upload.single('file');

export default upload;
