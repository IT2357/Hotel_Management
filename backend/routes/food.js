import express from "express";
import foodRoutes from "./foodRoutes.js";
import foodOrderRoutes from "./foodOrderRoutes.js";
import foodReviewRoutes from "./foodReviewRoutes.js";

const router = express.Router();

// Mount sub-routes
router.use('/items', foodRoutes);      // /api/food/items
router.use('/orders', foodOrderRoutes); // /api/food/orders
router.use('/reviews', foodReviewRoutes); // /api/food/reviews

export default router;