import express from 'express';
import {
  saveSelectedItems,
  getMenuForSelection,
  updateItemCustomizations,
  deleteExtractedMenu,
  getSelectionStats
} from '../controllers/menuSelectionController.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Get selection statistics (Admin/Manager only) - Must be before /:menuId route
router.get('/stats', authorizeRoles(['admin', 'manager']), getSelectionStats);

// Save selected items to MenuItem collection (Admin/Manager only)
router.post('/save-selected', authorizeRoles(['admin', 'manager']), saveSelectedItems);

// Get extracted menu for selection (Admin/Manager only)
router.get('/:menuId', authorizeRoles(['admin', 'manager']), getMenuForSelection);

// Update item customizations (Admin/Manager only)
router.put('/:menuId/item/:categoryName/:itemIndex', authorizeRoles(['admin', 'manager']), updateItemCustomizations);

// Delete extracted menu (Admin/Manager only)
router.delete('/:menuId', authorizeRoles(['admin', 'manager']), deleteExtractedMenu);

export default router;
