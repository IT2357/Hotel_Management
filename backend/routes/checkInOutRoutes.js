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
  getEligibleBookingsForGuest,
  processOverstayPayment,
  approveOverstayPayment,
  rejectOverstayPayment,
  adjustOverstayCharges,
  getPendingOverstayInvoices
} from "../controllers/checkInOutController.js";
import { authenticateToken as authenticate, requireRole as authorize } from "../middleware/auth.js";
import upload from '../middleware/fileUpload.js';
import { validateCheckInDate, validateCheckOutDate } from '../middleware/bookingDateValidation.js';

const router = express.Router();

// Check-in routes
router.post('/check-in', authenticate, authorize(['staff', 'receptionist', 'manager']), validateCheckInDate, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), checkInGuest);
router.post('/check-out', authenticate, authorize(['staff', 'receptionist', 'manager']), validateCheckOutDate, checkOutGuest);
router.get('/check-in/:id', authenticate, authorize(['staff', 'receptionist', 'manager', 'housekeeping']), getCheckInDetails);
router.get('/current-guests', authenticate, authorize(['staff', 'receptionist', 'manager', 'housekeeping']), listCurrentGuests);
router.put('/check-in/:id/preferences', authenticate, authorize(['staff', 'receptionist', 'manager']), updateGuestPreferences);

// Guest self-service routes with date validation
router.post('/guest/check-in', authenticate, authorize(['guest']), validateCheckInDate, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), checkInGuest);
router.put('/guest/complete-checkin', authenticate, authorize(['guest']), validateCheckInDate, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), completeGuestCheckIn);
router.post('/guest/check-out', authenticate, authorize(['guest']), validateCheckOutDate, checkOutGuest);
router.post('/guest/overstay-payment', authenticate, authorize(['guest']), processOverstayPayment);
router.get('/guest/status', authenticate, authorize(['guest']), getGuestCheckInStatus);
router.get('/guest/:id/receipt', authenticate, authorize(['guest']), generateReceipt);
router.patch('/guest/:id/preferences', authenticate, authorize(['guest']), updateGuestPreferences);
router.get('/guest/eligible-bookings', authenticate, authorize(['guest']), getEligibleBookingsForGuest);

// Admin overstay payment management routes
router.get('/admin/overstay/pending-invoices', authenticate, authorize(['admin', 'manager', 'receptionist']), getPendingOverstayInvoices);
router.post('/admin/overstay/:invoiceId/approve', authenticate, authorize(['admin', 'manager']), approveOverstayPayment);
router.post('/admin/overstay/:invoiceId/reject', authenticate, authorize(['admin', 'manager']), rejectOverstayPayment);
router.post('/admin/overstay/:invoiceId/adjust-charges', authenticate, authorize(['admin', 'manager']), adjustOverstayCharges);

export default router;