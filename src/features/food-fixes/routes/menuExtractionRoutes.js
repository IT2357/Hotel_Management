import express from 'express';
// Fix the import paths to point to the correct backend middleware
import { authenticateToken } from '../../../../backend/middleware/auth.js';
import { authorizeRoles } from '../../../../backend/middleware/roleAuth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AIExtractor from '../utils/AIExtractor.js';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', '..', 'uploads', 'menu-extraction'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only! (jpeg, jpg, png, gif)'));
    }
  }
});

// @route   POST /food-fixes/menu/process-image
// @desc    Process menu image and extract item information
// @access  Private/Admin
router.post('/process-image', 
  [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] }), upload.single('image')],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, msg: 'No image file provided' });
      }

      const imagePath = req.file.path;
      
      // Process the image with AI extractor
      const extractedData = await AIExtractor.extractMenuData(imagePath);
      
      // Clean up the uploaded file (optional)
      // fs.unlinkSync(imagePath);
      
      res.json({
        success: true,
        data: extractedData,
        message: 'Menu data extracted successfully'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Error processing image', error: err.message });
    }
  }
);

// @route   POST /food-fixes/menu/train-model
// @desc    Train OCR model with custom Jaffna data
// @access  Private/Admin
router.post('/train-model', [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] })], async (req, res) => {
  try {
    const { trainingDataPath } = req.body;
    
    if (!trainingDataPath) {
      return res.status(400).json({ success: false, msg: 'Training data path is required' });
    }
    
    // Train the model
    await AIExtractor.trainModel(trainingDataPath);
    
    res.json({
      success: true,
      message: 'Model training started successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Error training model', error: err.message });
  }
});

export default router;