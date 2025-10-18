import express from "express";
import {
  getAllFoodItems,
  getFoodItem,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getAllCategories,
  generateAIMenu
} from "../controllers/food/foodController.js";
import { processMenuImage } from "../controllers/food/menuController.js";
import multer from "multer";
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
import { authenticateToken as protect, requireRole as authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes (for guests and customers)
router.get('/', getAllFoodItems);
router.get('/categories', getAllCategories);
router.get('/:id', getFoodItem);

// Admin/Manager routes (protected)
router.post('/', protect, authorize('admin', 'manager'), createFoodItem);
router.put('/:id', protect, authorize('admin', 'manager'), updateFoodItem);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteFoodItem);


// AI Menu Generator (Admin/Manager only)
router.post('/ai/generate', protect, authorize('admin', 'manager'), generateAIMenu);

// AI-powered menu extraction from image (Admin/Manager only)
router.post('/menu/process-image', protect, authorize('admin', 'manager'), upload.single('image'), processMenuImage);

export default router;