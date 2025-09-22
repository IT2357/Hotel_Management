// 📁 backend/routes/bookings.js
import express from "express";
import {
  createBooking,
  getBookingById,
  requestCancellation
} from "../controllers/bookings/bookingController.js";

const router = express.Router();

// Create a new booking
router.post("/bookings", createBooking);



// Get a single booking by ID
router.get("/bookings/:id", getBookingById);

//cancel booking
router.put("/bookings/cancel/:id",requestCancellation);

export default router;
