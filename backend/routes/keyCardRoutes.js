import express from 'express';
import {
  createKeyCard,
  assignKeyCard,
  activateKeyCard,
  deactivateKeyCard,
  updateKeyCardStatus,
  listKeyCards,
  getKeyCardDetails,
  getAvailableKeyCards,
  assignKeyToGuest,
  returnKeyFromGuest
} from '../controllers/keyCardController.js';
import { authenticateToken as authenticate, requireRole as authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all key cards
router.get('/', authenticate, authorize(['staff', 'receptionist', 'manager']), listKeyCards);

// Get specific key card details
router.get('/:id', authenticate, authorize(['staff', 'receptionist', 'manager']), getKeyCardDetails);

// Get available key cards for assignment
router.get('/available', authenticate, authorize(['staff', 'receptionist', 'manager']), getAvailableKeyCards);

// Create new key card (admin/manager only)
router.post('/', authenticate, authorize(['manager']), createKeyCard);

// Assign key card to guest (during check-in)
router.patch('/:id/assign-guest', authenticate, authorize(['staff', 'receptionist', 'manager']), assignKeyToGuest);

// Return key card from guest (during check-out)
router.patch('/:id/return', authenticate, authorize(['staff', 'receptionist', 'manager']), returnKeyFromGuest);

// Manual assignment (legacy)
router.put('/:id/assign', authenticate, authorize(['staff', 'receptionist', 'manager']), assignKeyCard);

// Activate key card
router.put('/:id/activate', authenticate, authorize(['staff', 'receptionist', 'manager']), activateKeyCard);

// Deactivate key card
router.put('/:id/deactivate', authenticate, authorize(['staff', 'receptionist', 'manager']), deactivateKeyCard);

// Update key card status (lost, damaged, etc.)
router.put('/:id/status', authenticate, authorize(['staff', 'receptionist', 'manager']), updateKeyCardStatus);

export default router;
