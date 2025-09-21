// 📁 backend/routes/food/menuRoutes.js
import express from "express";
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  getCategories,
  getFeaturedItems,
  getPopularItems,
} from "../../controllers/food/menuController.js";
import { authenticateToken } from "../../middleware/auth.js";
import { authorizeRoles } from "../../middleware/roleAuth.js";
import { validateMenuItem, validateMenuCategory } from "../../middleware/validation.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/items", getMenuItems);
router.get("/items/:id", getMenuItem);
router.get("/categories", getCategories);
router.get("/featured", getFeaturedItems);
router.get("/popular", getPopularItems);

// Protected routes (admin/manager only)
router.post("/categories", authenticateToken, authorizeRoles(["admin", "manager"]), validateMenuCategory, createCategory);
router.post("/items", authenticateToken, authorizeRoles(["admin", "manager"]), validateMenuItem, createMenuItem);
router.put("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), validateMenuItem, updateMenuItem);
router.delete("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), deleteMenuItem);

export default router;
