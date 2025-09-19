// Placeholder for src/services/roomService.js
import api from "./api";

const roomService = {
getAllRooms: (params) => api.get("/rooms", { params }),
getRoomById: (id) => api.get(`/rooms/${id}`),
};

export default roomService;