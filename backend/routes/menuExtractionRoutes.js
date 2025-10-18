// 📁 backend/routes/menuExtractionRoutes.js
import express from "express";
import {
  extractMenu,
  getMenuPreview,
  saveMenu,
  getMenu,
  getMenuImage,
  listMenus,
  deleteMenu,
  getExtractionStats
} from "../controllers/menuExtractionController.js";
import { uploadSingle, handleMulterError } from "../middleware/gridfsUpload.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";

const router = express.Router();

// Public routes
router.get("/image/:imageId", getMenuImage);
router.get("/:id", getMenu);
router.get("/preview/:id", getMenuPreview);

// Protected routes (admin/manager only)
router.post(
  "/extract",
  authenticateToken,
  authorizeRoles(["admin", "manager"]),
  uploadSingle,
  handleMulterError,
  extractMenu
);

router.post(
  "/save",
  authenticateToken,
  authorizeRoles(["admin", "manager"]),
  saveMenu
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles(["admin", "manager"]),
  listMenus
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(["admin", "manager"]),
  deleteMenu
);

router.get(
  "/stats/overview",
  authenticateToken,
  authorizeRoles(["admin", "manager"]),
  getExtractionStats
);

export default router;
