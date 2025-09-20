// Placeholder for src/services/bookingService.js
import api from "./api";

const bookingService = {
createBooking: (params) => api.get("/bookings", { params }),
getBookingById: (id) => api.get(`/bookings/${id}`),
};

export default roomService;