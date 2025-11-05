import express from "express";
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  getFeaturedItems,
  getPopularItems,
  batchCreateMenuItems,
  getFoodItemsByCategory
} from "../controllers/food/menuController.js";
import { generateAIMenu } from "../controllers/food/foodController.js";
import { getMenuImage } from "../controllers/menuExtractionController.js";
import { extractMenuFromImageRealTime } from "../controllers/food/realtimeMenuExtractionController.js";
import {
  getAllFoodOrders,
  getFoodOrder,
  updateOrderStatus,
  getOrderStats,
  getCustomerOrders,
  createFoodOrder,
  modifyFoodOrder,
  cancelFoodOrder
} from "../controllers/food/foodOrderController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { validateMenuItem, validateMenuCategory } from "../middleware/validation.js";
import { uploadSingle, handleMulterError } from "../middleware/gridfsUpload.js";
import multer from "multer";
import foodPaymentRoutes from "./foodPaymentRoutes.js";
import foodAnalyticsService from "../services/food/foodAnalyticsService.js";
import { 
  foodPerformanceLogger, 
  foodErrorTracker, 
  foodRequestLogger, 
  orderProcessingTracker 
} from "../middleware/foodPerformanceLogger.js";
import foodLogger from "../utils/foodLogger.js";

const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
const router = express.Router();

// Apply performance monitoring middleware to all food routes
router.use(foodRequestLogger);
router.use(foodPerformanceLogger);
router.use(orderProcessingTracker);

// Public routes (no authentication required)
router.get("/items", getMenuItems);
router.get("/items/:id", getMenuItem);
router.get("/categories", getCategories);
router.get("/categories/:category/items", getFoodItemsByCategory);
router.get("/featured", getFeaturedItems);
router.get("/popular", getPopularItems);
router.get("/image/:imageId", getMenuImage);

// Protected routes (admin/manager only)
router.post("/categories", authenticateToken, authorizeRoles(["admin", "manager"]), validateMenuCategory, createCategory);
router.post("/items", authenticateToken, authorizeRoles(["admin", "manager"]), uploadSingle, handleMulterError, validateMenuItem, createMenuItem);
router.post("/batch", authenticateToken, authorizeRoles(["admin", "manager"]), batchCreateMenuItems);
router.put("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), uploadSingle, handleMulterError, validateMenuItem, updateMenuItem);
router.delete("/items/:id", authenticateToken, authorizeRoles(["admin", "manager"]), deleteMenuItem);

// AI Menu Generator (Admin/Manager only)
router.post("/ai/generate", authenticateToken, authorizeRoles(["admin", "manager"]), generateAIMenu);
router.post("/process-image", authenticateToken, authorizeRoles(["admin", "manager"]), upload.single('image'), extractMenuFromImageRealTime);

// Customer food order routes - MUST come BEFORE parameterized routes
// Support both authenticated users and guests (with email query param)
router.get("/orders/customer", optionalAuth, getCustomerOrders);
router.get("/orders/stats", authenticateToken, authorizeRoles(["admin", "manager"]), getOrderStats);

// Food order routes - Generic parameterized routes AFTER specific ones
router.post("/orders", optionalAuth, createFoodOrder); // Support both authenticated and guest customers
router.get("/orders", authenticateToken, authorizeRoles(["admin", "manager"]), getAllFoodOrders);
router.get("/orders/:id", authenticateToken, getFoodOrder);
router.put("/orders/:id/status", authenticateToken, updateOrderStatus);

// Payment routes
router.use("/payment", foodPaymentRoutes);

// Analytics routes (Admin/Manager only)
router.get("/analytics/overview", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const overview = await foodAnalyticsService.getDashboardOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error.message
    });
  }
});

router.get("/analytics/orders", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await foodAnalyticsService.getOrderAnalytics(startDate, endDate);
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: error.message
    });
  }
});

router.get("/analytics/items/popular", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const popularItems = await foodAnalyticsService.getPopularItems(parseInt(limit), startDate, endDate);
    res.status(200).json({
      success: true,
      data: popularItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular items',
      error: error.message
    });
  }
});

router.get("/analytics/peak-hours", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const peakHours = await foodAnalyticsService.getPeakHours(startDate, endDate);
    res.status(200).json({
      success: true,
      data: peakHours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch peak hours',
      error: error.message
    });
  }
});

router.get("/analytics/customers", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customerInsights = await foodAnalyticsService.getCustomerInsights(startDate, endDate);
    res.status(200).json({
      success: true,
      data: customerInsights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer insights',
      error: error.message
    });
  }
});

router.get("/analytics/kitchen", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const kitchenPerformance = await foodAnalyticsService.getKitchenPerformance(startDate, endDate);
    res.status(200).json({
      success: true,
      data: kitchenPerformance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen performance',
      error: error.message
    });
  }
});

router.get("/analytics/revenue", authenticateToken, authorizeRoles(["admin", "manager"]), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const revenueTrends = await foodAnalyticsService.getRevenueTrends(startDate, endDate, groupBy);
    res.status(200).json({
      success: true,
      data: revenueTrends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends',
      error: error.message
    });
  }
});

// Health check endpoint for food system
router.get("/health", async (req, res) => {
  try {
    const healthMetrics = foodLogger.getHealthMetrics();
    const orderStats = await foodLogger.getOrderStats(24);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      foodSystem: {
        orderStats,
        logFiles: {
          orders: 'food-orders.log',
          performance: 'food-performance.log',
          errors: 'food-errors.log',
          payments: 'food-payments.log',
          emails: 'food-emails.log',
          analytics: 'food-analytics.log',
          health: 'food-health.log'
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware for food routes
router.use(foodErrorTracker);

export default router;