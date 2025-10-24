import express from 'express';
import { 
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getPersonalizedOffers,
  getActiveOffers,
  applyOffer,
  getUserOrderHistory
} from '../controllers/offerController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';

const router = express.Router();

// Public routes - NO authentication required
router.route('/active')
  .get(getActiveOffers);

// User routes - MUST be defined before /:id to avoid conflicts
router.route('/personalized')
  .get(authenticateToken, getPersonalizedOffers);

router.route('/apply')
  .post(authenticateToken, applyOffer);

router.route('/history')
  .get(authenticateToken, getUserOrderHistory);

// Admin routes
router.route('/')
  .post(authenticateToken, authorizeRoles(['admin']), createOffer)
  .get(authenticateToken, authorizeRoles(['admin']), getAllOffers);

router.route('/:id')
  .get(authenticateToken, authorizeRoles(['admin']), getOfferById)
  .put(authenticateToken, authorizeRoles(['admin']), updateOffer)
  .delete(authenticateToken, authorizeRoles(['admin']), deleteOffer);

export default router;