// 📁 backend/services/payment/paymentService.js
import crypto from "crypto";
import axios from "axios";
import logger from "../../utils/logger.js";

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
   * Process payment for food orders
   * @param {Object} paymentData - Payment information
   * @returns {Object} - Payment response
   */
  async processOrderPayment(paymentData) {
    try {
      const {
        orderId,
        amount,
        currency = "LKR",
        paymentMethod,
        customerDetails,
        returnUrl,
        cancelUrl,
        notifyUrl
      } = paymentData;

      // Validate required fields
      if (!orderId || !amount || !paymentMethod || !customerDetails) {
        throw new Error("Order ID, amount, payment method, and customer details are required");
      }

      // Handle different payment methods
      switch (paymentMethod) {
        case 'card':
          return await this.processCardPayment({
            orderId,
            amount,
            currency,
            customerDetails,
            returnUrl,
            cancelUrl,
            notifyUrl
          });

        case 'wallet':
          return await this.processWalletPayment({
            orderId,
            amount,
            currency,
            customerDetails
          });

        case 'cash':
          return await this.processCashPayment({
            orderId,
            amount,
            currency,
            customerDetails
          });

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      logger.error("Order payment processing failed", {
        error: error.message,
        stack: error.stack,
        paymentData,
      });

      return {
        success: false,
        error: error.message || "Payment processing failed",
        errorCode: "PAYMENT_ERROR",
      };
    }
  }

  /**
   * Process card payment through PayHere
   * @param {Object} cardData - Card payment information
   * @returns {Object} - Payment response
   */
  async processCardPayment(cardData) {
    try {
      const {
        orderId,
        amount,
        currency,
        customerDetails,
        returnUrl,
        cancelUrl,
        notifyUrl
      } = cardData;

      // Prepare payment request data
      const paymentRequest = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: parseFloat(amount).toFixed(2),
        currency: currency,
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        notify_url: notifyUrl || `${process.env.BACKEND_URL}/api/webhooks/payhere`,
        payment_method: "CARD",
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Generate signature
      paymentRequest.signature = this.generateSignature(paymentRequest);

      logger.info("Processing PayHere card payment", {
        orderId,
        amount,
        customerEmail: customerDetails.customerEmail,
      });

      // Make API request to PayHere
      const response = await axios.post(
        `${this.apiUrl}/checkout`,
        paymentRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PAYHERE_API_TOKEN}`,
          },
          timeout: 30000,
        }
      );

      const paymentResponse = response.data;

      // Log successful payment initiation
      logger.info("PayHere card payment initiated successfully", {
        orderId,
        paymentId: paymentResponse.payment_id,
        status: paymentResponse.status,
      });

      return {
        success: true,
        paymentId: paymentResponse.payment_id,
        status: paymentResponse.status,
        redirectUrl: paymentResponse.redirect_url,
        amount: paymentResponse.amount,
        currency: paymentResponse.currency,
        gatewayResponse: paymentResponse,
      };
    } catch (error) {
      logger.error("PayHere card payment processing failed", {
        error: error.message,
        stack: error.stack,
        cardData,
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Card payment processing failed",
        errorCode: error.response?.data?.code || "CARD_PAYMENT_ERROR",
        gatewayResponse: error.response?.data,
      };
    }
  }

  /**
   * Process wallet payment (mock implementation)
   * @param {Object} walletData - Wallet payment information
   * @returns {Object} - Payment response
   */
  async processWalletPayment(walletData) {
    try {
      const { orderId, amount, currency, customerDetails } = walletData;

      // Mock wallet payment processing
      // In real implementation, integrate with wallet providers like PayPal, Google Pay, etc.
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

      logger.info("Wallet payment processed successfully", {
        orderId,
        amount,
        customerEmail: customerDetails.customerEmail,
      });

      return {
        success: true,
        paymentId: `WALLET_${Date.now()}`,
        status: "SUCCESS",
        amount: amount,
        currency: currency,
        paymentMethod: "WALLET",
        processedAt: new Date(),
      };
    } catch (error) {
      logger.error("Wallet payment processing failed", {
        error: error.message,
        walletData,
      });

      return {
        success: false,
        error: error.message || "Wallet payment processing failed",
        errorCode: "WALLET_PAYMENT_ERROR",
      };
    }
  }

  /**
   * Process cash on delivery payment
   * @param {Object} cashData - Cash payment information
   * @returns {Object} - Payment response
   */
  async processCashPayment(cashData) {
    try {
      const { orderId, amount, currency, customerDetails } = cashData;

      logger.info("Cash on delivery payment registered", {
        orderId,
        amount,
        customerEmail: customerDetails.customerEmail,
      });

      return {
        success: true,
        paymentId: `CASH_${Date.now()}`,
        status: "PENDING",
        amount: amount,
        currency: currency,
        paymentMethod: "CASH",
        message: "Cash on delivery payment registered. Payment will be collected upon delivery.",
        processedAt: new Date(),
      };
    } catch (error) {
      logger.error("Cash payment processing failed", {
        error: error.message,
        cashData,
      });

      return {
        success: false,
        error: error.message || "Cash payment processing failed",
        errorCode: "CASH_PAYMENT_ERROR",
      };
    }
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
   * @param {Object} paymentData - Original payment data
   * @returns {Object} - Validation result
   */
  validateRefundEligibility(paymentData) {
    const { paymentDate, paymentStatus, amount, refundAmount } = paymentData;

    const errors = [];

    // Check if payment is completed
    if (paymentStatus !== "completed") {
      errors.push("Payment must be completed to process refund");
    }

    // Check refund window (e.g., 180 days)
    const paymentAge = Date.now() - new Date(paymentDate).getTime();
    const maxRefundAge = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

    if (paymentAge > maxRefundAge) {
      errors.push("Refund window has expired (180 days limit)");
    }

    // Validate refund amount
    if (parseFloat(refundAmount) > parseFloat(amount)) {
      errors.push("Refund amount cannot exceed original payment amount");
    }

    if (parseFloat(refundAmount) <= 0) {
      errors.push("Refund amount must be greater than zero");
    }

    return {
      isEligible: errors.length === 0,
      errors,
      maxRefundAmount: amount,
    };
  }
}

export default new PaymentService();
