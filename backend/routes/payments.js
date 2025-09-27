// 📁 backend/routes/payments.js
import express from 'express';
import { initPayment, handleIPN } from '../controllers/payments/payhereController.js';

const router = express.Router();

// PayHere endpoints
// Initialize a payment for a food order
router.post('/payhere/init', initPayment);

// IPN callback (server-to-server) from PayHere
router.post('/payhere/ipn', express.urlencoded({ extended: false }), handleIPN);

export default router;
