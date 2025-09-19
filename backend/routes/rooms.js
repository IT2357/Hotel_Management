// Placeholder for backend/routes/rooms.js

import express from "express";
import { getAllRooms, getRoomById } from "../controllers/rooms/roomController.js";

const router = express.Router();


router.get("/", getAllRooms);
router.get("/:id", getRoomById);

export default router;
