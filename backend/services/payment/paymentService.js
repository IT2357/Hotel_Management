// 📁 backend/services/payment/paymentService.js
import crypto from "crypto";
import axios from "axios";
import logger from "../../utils/logger.js";
import InvoiceService from "./invoiceService.js";
import BookingService from "../booking/bookingService.js";

class PaymentService {
  constructor() {
    this.merchantId = process.env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    this.apiUrl =
      process.env.PAYHERE_API_URL || "https://sandbox.payhere.lk/pay/api/v2";
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * Generate PayHere signature for API requests
   * @param {Object} data - Data to sign
   * @returns {string} - Generated signature
   */
  generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    return crypto
      .createHmac("md5", this.merchantSecret)
      .update(signatureString)
      .digest("hex")
      .toUpperCase();
  }

  /**
   * Process refund through PayHere API
   * @param {Object} refundData - Refund information
   * @returns {Object} - Refund response
   */
  async processRefund(refundData) {
    try {
      const {
        originalPaymentId,
        refundAmount,
        refundReason,
        refundReference,
        currency = "LKR",
      } = refundData;

      // Validate required fields
      if (!originalPaymentId || !refundAmount) {
        throw new Error("Original payment ID and refund amount are required");
      }

      // Prepare refund request data
      const refundRequest = {
        merchant_id: this.merchantId,
        payment_id: originalPaymentId,
        amount: parseFloat(refundAmount).toFixed(2),
        currency: currency,
        reason: refundReason || "Customer refund request",
        reference: refundReference || `REF_${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Generate signature
      refundRequest.signature = this.generateSignature(refundRequest);

      logger.info("Processing PayHere refund", {
        paymentId: originalPaymentId,
        amount: refundAmount,
        reference: refundRequest.reference,
      });

      // Make API request to PayHere
      const response = await axios.post(
        `${this.apiUrl}/refund`,
        refundRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PAYHERE_API_TOKEN}`,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      const refundResponse = response.data;

      // Log successful refund
      logger.info("PayHere refund processed successfully", {
        paymentId: originalPaymentId,
        refundId: refundResponse.refund_id,
        status: refundResponse.status,
      });

      return {
        success: true,
        refundId: refundResponse.refund_id,
        status: refundResponse.status,
        amount: refundResponse.amount,
        currency: refundResponse.currency,
        processedAt: new Date(),
        gatewayResponse: refundResponse,
      };
    } catch (error) {
      logger.error("PayHere refund processing failed", {
        error: error.message,
        stack: error.stack,
        refundData,
      });

      // Handle specific PayHere errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.message || "Refund processing failed",
          errorCode: errorData.code,
          gatewayResponse: errorData,
        };
      }

      return {
        success: false,
        error: error.message || "Payment gateway error",
        errorCode: "GATEWAY_ERROR",
      };
    }
  }

  /**
   * Check refund status
   * @param {string} refundId - PayHere refund ID
   * @returns {Object} - Refund status
   */
  async checkRefundStatus(refundId) {
    try {
      const statusRequest = {
        merchant_id: this.merchantId,
        refund_id: refundId,
        timestamp: Math.floor(Date.now() / 1000),
      };

      statusRequest.signature = this.generateSignature(statusRequest);

      const response = await axios.get(
        `${this.apiUrl}/refund/${refundId}/status`,
        {
          params: statusRequest,
          headers: {
            Authorization: `Bearer ${process.env.PAYHERE_API_TOKEN}`,
          },
          timeout: 15000,
        }
      );

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        processedAt: response.data.processed_at,
        gatewayResponse: response.data,
      };
    } catch (error) {
      logger.error("Failed to check PayHere refund status", {
        refundId,
        error: error.message,
      });

      return {
        success: false,
        error: error.message || "Failed to check refund status",
      };
    }
  }

  /**
   * Validate PayHere webhook signature
   * @param {Object} data - Webhook data
   * @param {string} receivedSignature - Signature from webhook
   * @returns {boolean} - Validation result
   */
  validateWebhookSignature(data, receivedSignature) {
    try {
      const calculatedSignature = this.generateSignature(data);
      return calculatedSignature === receivedSignature.toUpperCase();
    } catch (error) {
      logger.error("Webhook signature validation failed", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Process partial refund
   * @param {Object} partialRefundData - Partial refund information
   * @returns {Object} - Refund response
   */
  async processPartialRefund(partialRefundData) {
    const {
      originalPaymentId,
      originalAmount,
      refundAmount,
      refundReason,
      refundReference,
    } = partialRefundData;

    // Validate partial refund amount
    if (parseFloat(refundAmount) > parseFloat(originalAmount)) {
      throw new Error("Refund amount cannot exceed original payment amount");
    }

    return this.processRefund({
      originalPaymentId,
      refundAmount,
      refundReason: refundReason || "Partial refund",
      refundReference,
    });
  }

  /**
   * Get supported currencies
   * @returns {Array} - List of supported currencies
   */
  getSupportedCurrencies() {
    return ["LKR", "USD", "GBP", "EUR", "AUD"];
  }

  /**

    // Make API request to PayHere
    const response = await axios.post(
      `${this.apiUrl}/refund`,
      refundRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYHERE_API_TOKEN}`,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    const refundResponse = response.data;

    // Log successful refund
    logger.info("PayHere refund processed successfully", {
      paymentId: originalPaymentId,
      refundId: refundResponse.refund_id,
      status: refundResponse.status,
    });

    return {
      success: true,
      refundId: refundResponse.refund_id,
      status: refundResponse.status,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      processedAt: new Date(),
      gatewayResponse: refundResponse,
    };
  } catch (error) {
    logger.error("PayHere refund processing failed", {
      error: error.message,
      stack: error.stack,
      refundData,
    });

    // Handle specific PayHere errors
    if (error.response?.data) {
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData.message || "Refund processing failed",
        errorCode: errorData.code,
        gatewayResponse: errorData,
      };
    }

    return {
      success: false,
      error: error.message || "Payment gateway error",
      errorCode: "GATEWAY_ERROR",
    };
  }
}

/**
 * Check refund status
 * @param {string} refundId - PayHere refund ID
 * @returns {Object} - Refund status
 */
async checkRefundStatus(refundId) {
  try {
    const statusRequest = {
      merchant_id: this.merchantId,
      refund_id: refundId,
      timestamp: Math.floor(Date.now() / 1000),
    };

    statusRequest.signature = this.generateSignature(statusRequest);

    const response = await axios.get(
      `${this.apiUrl}/refund/${refundId}/status`,
      {
        params: statusRequest,
        headers: {
          Authorization: `Bearer ${process.env.PAYHERE_API_TOKEN}`,
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      status: response.data.status,
      amount: response.data.amount,
      processedAt: response.data.processed_at,
      gatewayResponse: response.data,
    };
  } catch (error) {
    logger.error("Failed to check PayHere refund status", {
      refundId,
      error: error.message,
    });

    return {
      success: false,
      error: error.message || "Failed to check refund status",
    };
  }
}

/**
 * Validate PayHere webhook signature
 * @param {Object} data - Webhook data
 * @param {string} receivedSignature - Signature from webhook
 * @returns {boolean} - Validation result
 */
validateWebhookSignature(data, receivedSignature) {
  try {
    const calculatedSignature = this.generateSignature(data);
    return calculatedSignature === receivedSignature.toUpperCase();
  } catch (error) {
    logger.error("Webhook signature validation failed", {
      error: error.message,
    });
    return false;
  }
}

/**
 * Process partial refund
 * @param {Object} partialRefundData - Partial refund information
 * @returns {Object} - Refund response
 */
async processPartialRefund(partialRefundData) {
  const {
    originalPaymentId,
    originalAmount,
    refundAmount,
    refundReason,
    refundReference,
  } = partialRefundData;

  // Validate partial refund amount
  if (parseFloat(refundAmount) > parseFloat(originalAmount)) {
    throw new Error("Refund amount cannot exceed original payment amount");
  }

  return this.processRefund({
    originalPaymentId,
    refundAmount,
    refundReason: refundReason || "Partial refund",
    refundReference,
  });
}

/**
 * Get supported currencies
 * @returns {Array} - List of supported currencies
 */
getSupportedCurrencies() {
  return ["LKR", "USD", "GBP", "EUR", "AUD"];
}

/**
 * Validate refund eligibility
 */
validateRefundEligibility(paymentData) {
  const { paymentDate, paymentStatus, amount, refundAmount } = paymentData;
  const errors = [];

  if (paymentStatus !== "completed") {
    errors.push("Payment must be completed to process refund");
  }

  const paymentAge = Date.now() - new Date(paymentDate).getTime();
  const maxRefundAge = 180 * 24 * 60 * 60 * 1000; // 180 days

  if (paymentAge > maxRefundAge) {
    errors.push("Refund window has expired (180 days limit)");
  }

  return {
    isEligible: errors.length === 0,
    errors,
    maxRefundAmount: amount,
  };
  }
}

export default new PaymentService();
