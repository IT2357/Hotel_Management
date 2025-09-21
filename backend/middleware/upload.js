import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (for binary storage in MongoDB)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, WEBP, GIF)'), false);
  }
};

// Configure multer with higher limits to prevent 413 errors
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit (increased from 5MB)
    files: 1 // Only allow 1 file at a time
  },
  fileFilter: fileFilter
});

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
        message: 'Unexpected file field. Please use "image" as the field name.',
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
export const uploadSingle = upload.single('image');

// Multiple files upload middleware (if needed in future)
export const uploadMultiple = upload.array('images', 5);

export default upload;