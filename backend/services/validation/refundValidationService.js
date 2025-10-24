// 📁 backend/services/validation/refundValidationService.js
import RefundRequest from "../../models/RefundRequest.js";
import { User } from "../../models/User.js";
import Booking from "../../models/Booking.js";
import Invoice from "../../models/Invoice.js";
import logger from "../../utils/logger.js";
import config from "../../config/environment.js";

class RefundValidationService {
  /**
   * Validate refund request creation
   * @param {Object} refundData - Refund request data
   * @returns {Object} - Validation result
   */
  async validateRefundRequest(refundData) {
    const errors = [];
    const warnings = [];

    try {
      const {
        bookingId,
        guestId,
        invoiceId,
        amount,
        reason,
        evidence,
        currency = "LKR",
      } = refundData;

      // Required field validation
      if (!bookingId) errors.push("Booking ID is required");
      if (!guestId) errors.push("Guest ID is required");
      if (!amount || amount <= 0)
        errors.push("Valid refund amount is required");
      if (!reason || reason.trim().length < 10) {
        errors.push("Refund reason must be at least 10 characters long");
      }

      // Validate booking exists and belongs to guest
      if (bookingId && guestId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          errors.push("Booking not found");
        } else if (booking.guestId.toString() !== guestId.toString()) {
          errors.push("Booking does not belong to the specified guest");
        } else {
          // Check booking status - only allow refunds for confirmed bookings
          if (
            !["confirmed", "completed", "cancelled"].includes(booking.status)
          ) {
            errors.push(
              "Refunds can only be requested for confirmed, completed, or cancelled bookings"
            );
          }

          // Check if booking is too old for refund
          const bookingAge = Date.now() - new Date(booking.createdAt).getTime();
          const maxRefundAge =
            config.REFUND.MAX_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

          if (bookingAge > maxRefundAge) {
            errors.push(
              `Refund window has expired. Refunds must be requested within ${config.REFUND.MAX_REFUND_WINDOW_DAYS} days of booking`
            );
          }
        }
      }

      // Validate guest exists
      if (guestId) {
        const guest = await User.findById(guestId);
        if (!guest) {
                !["Confirmed", "Completed", "Cancelled"].includes(booking.status)
        } else if (guest.role !== "guest") {
          errors.push("Refund can only be requested by guests");
        }
      }

      // Validate invoice if provided
      if (invoiceId) {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          errors.push("Invoice not found");
        } else {
          // Check if refund amount exceeds invoice total/amount
          const invoiceTotal = typeof invoice.totalAmount === 'number' ? invoice.totalAmount : invoice.amount;
          if (amount > invoiceTotal) {
            errors.push("Refund amount cannot exceed invoice total");
          }

          // Check if invoice is paid
          if (invoice.status !== "Paid") {
            errors.push("Refunds can only be processed for paid invoices");
          }
        }
      }

      // Check for duplicate refund requests
      const existingRefund = await RefundRequest.findOne({
        bookingId,
        guestId,
        status: { $in: ["pending", "approved", "processed"] },
      });

      if (existingRefund) {
        errors.push(
          "A refund request for this booking is already pending or processed"
        );
      }

      // Validate amount thresholds
      if (amount > config.REFUND.REQUIRE_MANAGER_APPROVAL_ABOVE) {
        warnings.push(
          `Refund amount exceeds ${config.REFUND.REQUIRE_MANAGER_APPROVAL_ABOVE}. Manager approval required.`
        );
      }

      // Validate evidence if provided
      if (evidence && Array.isArray(evidence)) {
        evidence.forEach((item, index) => {
          if (!item.type || !item.description) {
            errors.push(
              `Evidence item ${index + 1} must have type and description`
            );
          }
          if (
            item.type &&
            !["receipt", "email", "document", "photo", "other"].includes(
              item.type
            )
          ) {
            errors.push(`Invalid evidence type: ${item.type}`);
          }
        });
      }

      // Currency validation
      if (currency && !["LKR", "USD", "GBP", "EUR", "AUD"].includes(currency)) {
        errors.push("Invalid currency code");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        requiresManagerApproval:
          amount > config.REFUND.REQUIRE_MANAGER_APPROVAL_ABOVE,
      };
    } catch (error) {
      logger.error("Error validating refund request", {
        error: error.message,
        stack: error.stack,
        refundData,
      });

      return {
        isValid: false,
        errors: ["Internal validation error occurred"],
        warnings: [],
      };
    }
  }

  /**
   * Validate refund approval
   * @param {Object} refund - Refund request object
   * @param {string} adminId - Admin performing the approval
   * @returns {Object} - Validation result
   */
  async validateRefundApproval(refund, adminId) {
    const errors = [];
    const warnings = [];

    try {
      // Check refund status
      if (refund.status !== "pending") {
        errors.push("Only pending refunds can be approved");
      }

      // Check if admin exists and has proper role
      const admin = await User.findById(adminId);
      if (!admin) {
        errors.push("Admin not found");
      } else if (!["admin", "manager"].includes(admin.role)) {
        errors.push("Insufficient privileges to approve refunds");
      }

      // Check if refund requires manager approval
      if (
        refund.amount > config.REFUND.REQUIRE_MANAGER_APPROVAL_ABOVE &&
        admin?.role !== "manager"
      ) {
        errors.push(
          `Refunds above ${config.REFUND.REQUIRE_MANAGER_APPROVAL_ABOVE} require manager approval`
        );
      }

      // Check if refund is still within approval window
      const refundAge = Date.now() - new Date(refund.createdAt).getTime();
      const maxApprovalAge =
        config.REFUND.MAX_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

      if (refundAge > maxApprovalAge) {
        warnings.push(
          "Refund request is older than the standard approval window"
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Error validating refund approval", {
        error: error.message,
        refundId: refund._id,
        adminId,
      });

      return {
        isValid: false,
        errors: ["Internal validation error occurred"],
        warnings: [],
      };
    }
  }

  /**
   * Validate refund denial
   * @param {Object} refund - Refund request object
   * @param {string} reason - Denial reason
   * @param {string} adminId - Admin performing the denial
   * @returns {Object} - Validation result
   */
  async validateRefundDenial(refund, reason, adminId) {
    const errors = [];
    const warnings = [];

    try {
      // Check refund status
      if (refund.status !== "pending") {
        errors.push("Only pending refunds can be denied");
      }

      // Validate denial reason
      if (!reason || reason.trim().length < 20) {
        errors.push("Denial reason must be at least 20 characters long");
      }

      // Check if admin exists and has proper role
      const admin = await User.findById(adminId);
      if (!admin) {
        errors.push("Admin not found");
      } else if (!["admin", "manager"].includes(admin.role)) {
        errors.push("Insufficient privileges to deny refunds");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Error validating refund denial", {
        error: error.message,
        refundId: refund._id,
        adminId,
      });

      return {
        isValid: false,
        errors: ["Internal validation error occurred"],
        warnings: [],
      };
    }
  }

  /**
   * Validate refund processing
   * @param {Object} refund - Refund request object
   * @param {string} originalPaymentId - Original payment ID
   * @returns {Object} - Validation result
   */
  async validateRefundProcessing(refund, originalPaymentId) {
    const errors = [];
    const warnings = [];

    try {
      // Check refund status
      if (refund.status !== "approved") {
        errors.push("Only approved refunds can be processed");
      }

      // Fetch invoice context to determine if gateway reference is needed
      let invoice = null;
      if (refund.invoiceId) {
        const Invoice = (await import("../../models/Invoice.js")).default;
        invoice = await Invoice.findById(refund.invoiceId);
      }

      // Validate invoice status
      if (!invoice) {
        errors.push("Linked invoice not found");
      } else {
        if (invoice.status !== 'Paid') {
          errors.push("Cannot process refund for unpaid invoice");
        }

        // For non-cash payments, require originalPaymentId (gateway reference)
        if (invoice.paymentMethod !== 'Cash') {
          if (!originalPaymentId || originalPaymentId.trim().length === 0) {
            errors.push("Original payment ID is required for gateway refunds");
          }
        }
      }

      // Check if refund has already been processed
      if (refund.paymentGatewayRef) {
        warnings.push("Refund appears to have been previously processed");
      }

      // Check approval age - warn if very old
      if (refund.approvedAt) {
        const approvalAge = Date.now() - new Date(refund.approvedAt).getTime();
        const maxProcessingDelay = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (approvalAge > maxProcessingDelay) {
          warnings.push(
            "Refund approval is older than 7 days. Verify payment details before processing."
          );
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Error validating refund processing", {
        error: error.message,
        refundId: refund._id,
        originalPaymentId,
      });

      return {
        isValid: false,
        errors: ["Internal validation error occurred"],
        warnings: [],
      };
    }
  }

  /**
   * Validate business hours for refund operations
   * @returns {Object} - Validation result
   */
  validateBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    const isWeekend = day === 0 || day === 6;
    const isBusinessHours = hour >= 9 && hour <= 17; // 9 AM to 5 PM

    const warnings = [];

    if (isWeekend) {
      warnings.push(
        "Processing refund during weekend. Consider manual review."
      );
    }

    if (!isBusinessHours) {
      warnings.push(
        "Processing refund outside business hours. Consider manual review."
      );
    }

    return {
      isValid: true,
      errors: [],
      warnings,
    };
  }

  /**
   * Validate refund request rate limiting
   * @param {string} guestId - Guest ID
   * @returns {Object} - Validation result
   */
  async validateRateLimit(guestId) {
    const errors = [];
    const warnings = [];

    try {
      // Check number of refund requests in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRefunds = await RefundRequest.countDocuments({
        guestId,
        createdAt: { $gte: oneDayAgo },
      });

      if (recentRefunds >= 3) {
        errors.push(
          "Too many refund requests. Maximum 3 requests per 24 hours."
        );
      } else if (recentRefunds >= 2) {
        warnings.push(
          "Multiple refund requests detected. Consider reviewing guest account."
        );
      }

      // Check total number of refunds for this guest
      const totalRefunds = await RefundRequest.countDocuments({ guestId });

      if (totalRefunds >= 10) {
        warnings.push(
          "Guest has high number of refund requests. Consider account review."
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Error validating refund rate limit", {
        error: error.message,
        guestId,
      });

      return {
        isValid: false,
        errors: ["Internal validation error occurred"],
        warnings: [],
      };
    }
  }

  /**
   * Comprehensive refund validation
   * @param {Object} refundData - Complete refund data
   * @param {string} operation - Operation type (create, approve, deny, process)
   * @param {Object} context - Additional context (adminId, etc.)
   * @returns {Object} - Complete validation result
   */
  async validateRefund(refundData, operation, context = {}) {
    const results = [];

    try {
      switch (operation) {
        case "create":
          results.push(await this.validateRefundRequest(refundData));
          results.push(await this.validateRateLimit(refundData.guestId));
          results.push(this.validateBusinessHours());
          break;

        case "approve":
          results.push(
            await this.validateRefundApproval(refundData, context.adminId)
          );
          results.push(this.validateBusinessHours());
          break;

        case "deny":
          results.push(
            await this.validateRefundDenial(
              refundData,
              context.reason,
              context.adminId
            )
          );
          break;

        case "process":
          results.push(
            await this.validateRefundProcessing(
              refundData,
              context.originalPaymentId
            )
          );
          results.push(this.validateBusinessHours());
          break;

        default:
          return {
            isValid: false,
            errors: ["Invalid operation type"],
            warnings: [],
          };
      }

      // Combine all validation results
      const combinedErrors = results.flatMap((r) => r.errors);
      const combinedWarnings = results.flatMap((r) => r.warnings);
      const isValid = results.every((r) => r.isValid);

      // Check for special requirements
      const requiresManagerApproval = results.some(
        (r) => r.requiresManagerApproval
      );

      return {
        isValid,
        errors: combinedErrors,
        warnings: combinedWarnings,
        requiresManagerApproval,
      };
    } catch (error) {
      logger.error("Error in comprehensive refund validation", {
        error: error.message,
        operation,
        context,
      });

      return {
        isValid: false,
        errors: ["Validation system error occurred"],
        warnings: [],
      };
    }
  }
}

export default new RefundValidationService();
