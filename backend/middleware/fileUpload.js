import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import environment from '../config/environment.js';

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = environment.CLOUDINARY.CLOUD_NAME &&
  environment.CLOUDINARY.API_KEY &&
  environment.CLOUDINARY.API_SECRET;

let storage;

if (isCloudinaryConfigured) {
  // Use Cloudinary storage if configured
  cloudinary.config({
    cloud_name: environment.CLOUDINARY.CLOUD_NAME,
    api_key: environment.CLOUDINARY.API_KEY,
    api_secret: environment.CLOUDINARY.API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'hotel-management',
      allowed_formats: ['jpg', 'png', 'pdf']
    }
  });
} else {
  // Fallback to local storage if Cloudinary is not configured
  console.warn('⚠️  Cloudinary not configured, using local file storage');

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

export default upload;
