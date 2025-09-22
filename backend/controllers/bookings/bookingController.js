// 📁 backend/controllers/bookings/bookingController.js
import Booking from "../../models/Booking.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    const booking = new Booking(bookingData);
    await booking.save();
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create booking", error });
  }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("roomId")
      .populate("userId");
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bookings", error });
  }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("roomId")
      .populate("userId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch booking", error });
  }
};

// Update booking status (Confirm / Cancel)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    if (status === "Cancelled") booking.cancelledAt = new Date();
    if (status === "Confirmed") booking.confirmedAt = new Date();
    if (status === "Rejected") booking.cancelledAt = new Date(); // Optional: mark rejection time

    await booking.save();
    res.status(200).json({ message: "Booking status updated", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update booking", error });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete booking", error });
  }
};

// Request booking cancellation (user)
export const requestCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Directly mark as Cancelled
    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel booking", error });
  }
};

// Reject a booking (admin)
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "Rejected";
    booking.cancelledAt = new Date(); // optional: track when it was rejected
    await booking.save();

    res.status(200).json({
      message: "Booking rejected successfully",
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject booking", error });
  }
};
