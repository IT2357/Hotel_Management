// 📁 backend/routes/invoiceRoutes.js
import express from "express";
import invoiceController from "../controllers/invoiceController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ===== USER ROUTES =====

// Get user's invoices
router.get("/my-invoices", authenticateToken, invoiceController.getUserInvoices);

// Get specific invoice details
router.get("/:invoiceId", authenticateToken, invoiceController.getInvoiceDetails);

// ===== ADMIN ROUTES =====

// Create invoice for booking
router.post("/booking/:bookingId", authenticateToken, requireRole(['admin', 'manager']), invoiceController.createBookingInvoice);

// Finalize invoice
router.put("/:invoiceId/finalize", authenticateToken, requireRole(['admin', 'manager']), invoiceController.finalizeInvoice);

// Get all invoices with filtering
router.get("/admin/all", authenticateToken, requireRole(['admin', 'manager']), invoiceController.getAllInvoices);

// Update invoice status
router.put("/admin/:invoiceId/status", authenticateToken, requireRole(['admin', 'manager']), invoiceController.updateInvoiceStatus);

// Get invoice statistics
router.get("/admin/stats", authenticateToken, requireRole(['admin', 'manager']), invoiceController.getInvoiceStats);

export default router;
