import express from "express";
import {
  checkInGuest,
  checkOutGuest,
  getCheckInDetails,
  listCurrentGuests,
  updateGuestPreferences,
  generateReceipt,
  getGuestCheckInStatus,
  completeGuestCheckIn,
  getEligibleBookingsForGuest
} from "../controllers/checkInOutController.js";
import { authenticateToken as authenticate, requireRole as authorize } from "../middleware/auth.js";
import upload from '../middleware/fileUpload.js';

const router = express.Router();

// Check-in routes
router.post('/check-in', authenticate, authorize(['staff', 'receptionist', 'manager']), upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), checkInGuest);
router.post('/check-out', authenticate, authorize(['staff', 'receptionist', 'manager']), checkOutGuest);
router.get('/check-in/:id', authenticate, authorize(['staff', 'receptionist', 'manager', 'housekeeping']), getCheckInDetails);
router.get('/current-guests', authenticate, authorize(['staff', 'receptionist', 'manager', 'housekeeping']), listCurrentGuests);
router.put('/check-in/:id/preferences', authenticate, authorize(['staff', 'receptionist', 'manager']), updateGuestPreferences);

// Guest self-service routes
router.post('/guest/check-in', authenticate, authorize(['guest']), upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), checkInGuest);
router.put('/guest/complete-checkin', authenticate, authorize(['guest']), upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), completeGuestCheckIn);
router.post('/guest/check-out', authenticate, authorize(['guest']), checkOutGuest);
router.get('/guest/status', authenticate, authorize(['guest']), getGuestCheckInStatus);
router.get('/guest/:id/receipt', authenticate, authorize(['guest']), generateReceipt);
router.patch('/guest/:id/preferences', authenticate, authorize(['guest']), updateGuestPreferences);
router.get('/guest/eligible-bookings', authenticate, authorize(['guest']), getEligibleBookingsForGuest);

export default router;