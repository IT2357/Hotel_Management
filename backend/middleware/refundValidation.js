// 📁 backend/middleware/refundValidation.js
import RefundValidationService from "../services/validation/refundValidationService.js";
import logger from "../utils/logger.js";

/**
 * Middleware to validate refund request creation
 */
export const validateRefundCreation = async (req, res, next) => {
  try {
    const validation = await RefundValidationService.validateRefund(
      req.body,
      "create"
    );

    if (!validation.isValid) {
      logger.warn("Refund creation validation failed", {
        errors: validation.errors,
        body: req.body,
        userId: req.user?._id,
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Attach validation result to request for use in controller
    req.validationResult = validation;
    next();
  } catch (error) {
    logger.error("Error in refund creation validation middleware", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Validation error occurred",
    });
  }
};

/**
 * Middleware to validate refund approval
 */
export const validateRefundApproval = async (req, res, next) => {
  try {
    const { refund } = req; // Assuming refund is attached by previous middleware

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    const validation = await RefundValidationService.validateRefund(
      refund,
      "approve",
      { adminId: req.user._id }
    );

    if (!validation.isValid) {
      logger.warn("Refund approval validation failed", {
        errors: validation.errors,
        refundId: refund._id,
        adminId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: "Approval validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    req.validationResult = validation;
    next();
  } catch (error) {
    logger.error("Error in refund approval validation middleware", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Validation error occurred",
    });
  }
};

/**
 * Middleware to validate refund denial
 */
export const validateRefundDenial = async (req, res, next) => {
  try {
    const { refund } = req;
    const { reason } = req.body;

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    const validation = await RefundValidationService.validateRefund(
      refund,
      "deny",
      {
        adminId: req.user._id,
        reason: reason,
      }
    );

    if (!validation.isValid) {
      logger.warn("Refund denial validation failed", {
        errors: validation.errors,
        refundId: refund._id,
        adminId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: "Denial validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    req.validationResult = validation;
    next();
  } catch (error) {
    logger.error("Error in refund denial validation middleware", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Validation error occurred",
    });
  }
};

/**
 * Middleware to validate refund processing
 */
export const validateRefundProcessing = async (req, res, next) => {
  try {
    const { refund } = req;
    const { originalPaymentId } = req.body;

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    const validation = await RefundValidationService.validateRefund(
      refund,
      "process",
      { originalPaymentId: originalPaymentId }
    );

    if (!validation.isValid) {
      logger.warn("Refund processing validation failed", {
        errors: validation.errors,
        refundId: refund._id,
        adminId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: "Processing validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    req.validationResult = validation;
    next();
  } catch (error) {
    logger.error("Error in refund processing validation middleware", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Validation error occurred",
    });
  }
};

/**
 * Middleware to load refund by ID and attach to request
 */
export const loadRefundById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Refund ID is required",
      });
    }

    const RefundRequest = (await import("../models/RefundRequest.js")).default;
    const refund = await RefundRequest.findById(id)
      .populate("bookingId", "bookingNumber guestId")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber totalAmount status paymentMethod");

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    req.refund = refund;
    next();
  } catch (error) {
    logger.error("Error loading refund by ID", {
      error: error.message,
      refundId: req.params.id,
    });

    res.status(500).json({
      success: false,
      message: "Error loading refund",
    });
  }
};

/**
 * Middleware to validate admin permissions for refund operations
 */
export const validateRefundPermissions = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check if user has admin or manager role
      if (!["admin", "manager"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient privileges for refund operations",
        });
      }

      // For high-value refunds, require manager role
      if (
        req.refund &&
        req.refund.amount > process.env.REQUIRE_MANAGER_APPROVAL_ABOVE
      ) {
        if (user.role !== "manager" && requiredPermission === "approve") {
          return res.status(403).json({
            success: false,
            message: "Manager approval required for high-value refunds",
          });
        }
      }

      next();
    } catch (error) {
      logger.error("Error in refund permissions validation", {
        error: error.message,
        userId: req.user?._id,
        requiredPermission,
      });

      res.status(500).json({
        success: false,
        message: "Permission validation error",
      });
    }
  };
};

/**
 * Middleware to log refund operations for audit trail
 */
export const logRefundOperation = (operation) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log the operation
      logger.info("Refund operation completed", {
        operation,
        refundId: req.refund?._id,
        adminId: req.user?._id,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        validationWarnings: req.validationResult?.warnings,
      });

      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Combined middleware for refund operations
 */
export const refundOperationMiddleware = (operation) => {
  const middlewares = [loadRefundById];

  switch (operation) {
    case "approve":
      middlewares.push(
        validateRefundPermissions("approve"),
        validateRefundApproval,
        logRefundOperation("approve")
      );
      break;
    case "deny":
      middlewares.push(
        validateRefundPermissions("deny"),
        validateRefundDenial,
        logRefundOperation("deny")
      );
      break;
    case "process":
      middlewares.push(
        validateRefundPermissions("process"),
        validateRefundProcessing,
        logRefundOperation("process")
      );
      break;
    case "request-info":
      middlewares.push(
        validateRefundPermissions("read"),
        logRefundOperation("request-info")
      );
      break;
    default:
      middlewares.push(logRefundOperation(operation));
  }

  return middlewares;
};

export default {
  validateRefundCreation,
  validateRefundApproval,
  validateRefundDenial,
  validateRefundProcessing,
  loadRefundById,
  validateRefundPermissions,
  logRefundOperation,
  refundOperationMiddleware,
};
