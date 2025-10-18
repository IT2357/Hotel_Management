import express from "express";
import foodRoutes from "./foodRoutes.js";
import foodOrderRoutes from "./foodOrderRoutes.js";
// foodReviewRoutes moved to separate /api/food/reviews route

const router = express.Router();

// Mount sub-routes
router.use('/items', foodRoutes);      // /api/food/items
router.use('/orders', foodOrderRoutes); // /api/food/orders
// Reviews are now handled by /api/food/reviews route in server.js

export default router;