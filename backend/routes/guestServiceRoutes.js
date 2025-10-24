import express from "express";
import {
  createServiceRequest,
  getServiceRequests,
  getRequestDetails,
  updateRequestStatus,
  addRequestNotes,
  getMyServiceRequests
} from "../controllers/guestServiceController.js";
import GuestServiceRequest from "../models/GuestServiceRequest.js";
import { authenticateToken as authenticate, requireRole as authorize } from "../middleware/auth.js";
import upload from '../middleware/fileUpload.js';
import {
  validateStatusUpdate,
  validateNoteAddition
} from "../validations/guestServiceValidation.js";

const router = express.Router();

// Guest-facing routes
// Require authentication and guest role to create a service request
router.post(
  '/request',
  authenticate,
  authorize(['guest']),
  upload.array('attachments'),
  createServiceRequest
);

// Get guest's own requests
router.get('/my-requests', authenticate, authorize(['guest']), getMyServiceRequests);

// Submit feedback for a request
router.post('/:id/feedback', authenticate, authorize(['guest']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const request = await GuestServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Ensure the request belongs to the authenticated guest
    if (request.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    request.feedback = {
      rating: parseInt(rating),
      comment,
      submittedAt: new Date()
    };
    
    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Staff-facing routes
router.get('/', authenticate, authorize(['staff', 'manager']), getServiceRequests);
router.get('/:id', authenticate, authorize(['staff', 'manager']), getRequestDetails);
router.patch(
  '/:id/status', 
  authenticate, 
  authorize(['staff', 'manager']),
  (req, res, next) => {
    console.log('🚪 Route hit: PATCH /guest-services/:id/status');
    console.log('👤 Authenticated user:', req.user);
    console.log('📋 Request body:', req.body);
    console.log('🔗 Request params:', req.params);
    next();
  },
  validateStatusUpdate, 
  updateRequestStatus
);
router.post(
  '/:id/notes', 
  authenticate, 
  authorize(['staff', 'manager']),
  (req, res, next) => {
    console.log('🚪 Route hit: POST /guest-services/:id/notes');
    console.log('👤 Authenticated user:', req.user);
    console.log('📋 Request body:', req.body);
    console.log('🔗 Request params:', req.params);
    next();
  },
  validateNoteAddition, 
  addRequestNotes
);

export default router;
