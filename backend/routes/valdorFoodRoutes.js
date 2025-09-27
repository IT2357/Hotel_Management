// 📁 backend/routes/valdorFoodRoutes.js
import express from 'express';
import {
  getValdorFoods,
  getValdorFood,
  getValdorCategories,
  createValdorFood,
  updateValdorFood,
  deleteValdorFood,
  extractValdorMenu,
  scrapeValdorWebsite,
  getValdorStats,
  searchValdorFoods
} from '../controllers/valdorFoodController.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/foods', getValdorFoods);
router.get('/foods/:id', getValdorFood);
router.get('/categories', getValdorCategories);
router.get('/stats', getValdorStats);
router.post('/search', searchValdorFoods);

// Protected routes (authentication required)
// Admin/Manager only routes
router.post('/foods', protect, authorizeRoles(['admin', 'manager']), createValdorFood);
router.put('/foods/:id', protect, authorizeRoles(['admin', 'manager']), updateValdorFood);
router.delete('/foods/:id', protect, authorizeRoles(['admin', 'manager']), deleteValdorFood);

// AI Menu Extraction routes (Admin/Manager only)
router.post('/extract-menu', protect, authorizeRoles(['admin', 'manager']), extractValdorMenu);
router.post('/scrape-website', protect, authorizeRoles(['admin', 'manager']), scrapeValdorWebsite);

export default router;
