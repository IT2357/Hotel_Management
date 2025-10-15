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
    // Handle both single file (req.file) and multiple files (req.files)
    let filesToProcess = [];

    if (req.file) {
      // Single file upload
      filesToProcess = [req.file];
    } else if (req.files) {
      // Multiple files upload (from upload.any() or upload.fields())
      if (Array.isArray(req.files)) {
        filesToProcess = req.files;
      } else {
        // req.files is an object with field names as keys
        filesToProcess = Object.values(req.files).flat();
      }
    }

    console.log('🔍 DEBUG: filesToProcess length:', filesToProcess.length);

    // Process each file
    for (const file of filesToProcess) {
      if (file && file.buffer) {
        console.log('📁 Uploading file to GridFS:', file.originalname);

        // Upload to GridFS using our service
        const fileId = await gridfsService.uploadImage(
          file.buffer,
          file.originalname,
          {
            uploadedBy: req.user?.id,
            purpose: 'menu_extraction',
            originalSize: file.size,
            mimeType: file.mimetype
          }
        );

        // Add GridFS file ID to file object
        file.id = fileId;
        file.gridfsId = fileId;

        console.log('✅ File uploaded to GridFS with ID:', fileId);
        console.log('🔍 Setting gridfsId on file object:', file.gridfsId);
      }
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

// Middleware for menu extraction that accepts any fields
export const uploadForMenuExtraction = upload.any();

export default upload;
