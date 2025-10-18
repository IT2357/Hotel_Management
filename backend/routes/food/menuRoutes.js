import { uploadSingle, handleMulterError } from "../../middleware/gridfsUpload.js";
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
  batchCreateMenuItems,
  getFoodItemsByCategory,
} from "../../controllers/food/menuController.js";
import {
  getFoodItems,
  getFoodCategories,
  getFoodItem,
  getFoodItemsByCategory as getMenuItemsByCategory
} from "../../controllers/menu/foodController.js";
import { getMenuImage } from "../../controllers/menuExtractionController.js";
import {
  getAllFoodOrders,
  getFoodOrder,
  updateOrderStatus,
  getOrderStats,
  getCustomerOrders,
  createFoodOrder
} from "../../controllers/food/foodOrderController.js";
// Review functions are now handled by separate food review routes
// import {
//   submitOrderReview,
//   getOrderReview,
//   getAllReviews,
//   moderateReview,
//   getReviewStats
// } from "../../controllers/food/foodReviewController.js";
import { authenticateToken } from "../../middleware/auth.js";
import { authorizeRoles } from "../../middleware/roleAuth.js";
import { validateMenuItem, validateMenuCategory } from "../../middleware/validation.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/items", getMenuItems);
router.get("/items/:id", getMenuItem);
router.get("/categories", getCategories);
router.get("/categories/:category/items", getFoodItemsByCategory);
router.get("/featured", getFeaturedItems);
router.get("/popular", getPopularItems);
router.options("/image/:imageId", (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.status(200).end();
});
router.get("/image/:imageId", getMenuImage);

// Protected routes (admin/manager only)
router.post("/categories", authenticateToken, authorizeRoles(["admin", "manager"]), validateMenuCategory, createCategory);
router.post("/items", authenticateToken, authorizeRoles(["admin", "manager"]), uploadSingle, handleMulterError, validateMenuItem, createMenuItem);
router.post("/batch", authenticateToken, authorizeRoles(["admin", "manager"]), batchCreateMenuItems);
router.put("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), uploadSingle, handleMulterError, validateMenuItem, updateMenuItem);
router.delete("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), deleteMenuItem);

// Food order routes
router.get("/orders", authenticateToken, authorizeRoles(["admin", "manager"]), getAllFoodOrders);
router.get("/orders/stats", authenticateToken, authorizeRoles(["admin", "manager"]), getOrderStats);
router.get("/orders/:id", authenticateToken, getFoodOrder);
router.put("/orders/:id/status", authenticateToken, updateOrderStatus);

// Customer food order routes
router.post("/orders", createFoodOrder); // Public for customers
router.get("/orders/customer/:customerEmail", getCustomerOrders);
router.get("/orders/customer/status/:orderNumber", getCustomerOrders);

// Review routes - moved to separate food review routes
// router.post("/orders/:orderId/reviews", authenticateToken, submitOrderReview);
// router.get("/orders/:orderId/reviews", authenticateToken, getOrderReview);
// router.delete("/orders/:orderId/reviews", authenticateToken, deleteReview);

// Admin review management routes - moved to separate food review routes
// router.get("/reviews", authenticateToken, authorizeRoles(["admin", "manager"]), getAllReviews);
// router.get("/reviews/stats", authenticateToken, authorizeRoles(["admin", "manager"]), getReviewStats);
// router.put("/orders/:orderId/reviews/moderate", authenticateToken, authorizeRoles(["admin", "manager"]), moderateReview);

export default router;
