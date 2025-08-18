// 📁 backend/routes/webhooks.js
import express from "express";
import PaymentService from "../services/payment/paymentService.js";
import RefundRequest from "../models/RefundRequest.js";
import logger from "../utils/logger.js";
import EmailService from "../services/notification/emailService.js";

const router = express.Router();

// PayHere webhook handler for refund status updates
router.post("/payhere/refund", async (req, res) => {
  try {
    const webhookData = req.body;
    const signature = req.headers["x-payhere-signature"];

    logger.info("Received PayHere refund webhook", {
      data: webhookData,
      signature,
    });

    // Validate webhook signature
    if (!PaymentService.validateWebhookSignature(webhookData, signature)) {
      logger.warn("Invalid PayHere webhook signature", {
        receivedSignature: signature,
        data: webhookData,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const {
      refund_id,
      payment_id,
      status,
      amount,
      currency,
      merchant_reference,
      processed_at,
      failure_reason,
    } = webhookData;

    // Find the refund request by payment gateway reference
    const refundRequest = await RefundRequest.findOne({
      paymentGatewayRef: refund_id,
    })
      .populate("guestId", "name email")
      .populate("bookingId", "bookingNumber");

    if (!refundRequest) {
      logger.warn("Refund request not found for webhook", {
        refundId: refund_id,
        paymentId: payment_id,
      });

      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    // Update refund status based on webhook data
    const previousStatus = refundRequest.status;

    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        refundRequest.status = "processed";
        refundRequest.processedAt = new Date(processed_at);

        logger.info("Refund marked as processed via webhook", {
          refundRequestId: refundRequest._id,
          paymentGatewayRef: refund_id,
          amount,
        });

        // Send success notification to guest
        try {
          await EmailService.sendRefundProcessedEmail(refundRequest.guestId, {
            refundId: refundRequest._id,
            amount: refundRequest.amount,
            currency: refundRequest.currency || currency,
            bookingNumber: refundRequest.bookingId?.bookingNumber,
            processedAt: refundRequest.processedAt,
            estimatedArrival: "3-5 business days",
          });
        } catch (emailError) {
          logger.error("Failed to send refund success email", {
            refundRequestId: refundRequest._id,
            error: emailError.message,
          });
        }
        break;

      case "failed":
      case "error":
        refundRequest.status = "failed";
        refundRequest.failureReason =
          failure_reason || "Payment gateway processing failed";

        logger.error("Refund marked as failed via webhook", {
          refundRequestId: refundRequest._id,
          paymentGatewayRef: refund_id,
          reason: failure_reason,
        });

        // Send failure notification to admins
        try {
          await EmailService.sendRefundFailedNotification({
            refundId: refundRequest._id,
            amount: refundRequest.amount,
            error: failure_reason,
            bookingNumber: refundRequest.bookingId?.bookingNumber,
            guestEmail: refundRequest.guestId?.email,
          });
        } catch (emailError) {
          logger.error("Failed to send refund failure notification", {
            refundRequestId: refundRequest._id,
            error: emailError.message,
          });
        }
        break;

      case "pending":
        refundRequest.status = "processing";
        logger.info("Refund marked as processing via webhook", {
          refundRequestId: refundRequest._id,
          paymentGatewayRef: refund_id,
        });
        break;

      default:
        logger.warn("Unknown refund status received from webhook", {
          status,
          refundRequestId: refundRequest._id,
          paymentGatewayRef: refund_id,
        });
        break;
    }

    // Update gateway response data
    refundRequest.gatewayResponse = {
      ...refundRequest.gatewayResponse,
      webhook: {
        status,
        amount,
        currency,
        processedAt: processed_at,
        failureReason: failure_reason,
        receivedAt: new Date(),
      },
    };

    await refundRequest.save();

    logger.info("Refund request updated from webhook", {
      refundRequestId: refundRequest._id,
      previousStatus,
      newStatus: refundRequest.status,
      paymentGatewayRef: refund_id,
    });

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    logger.error("Error processing PayHere refund webhook", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});

// PayHere webhook handler for payment notifications (for future use)
router.post("/payhere/payment", async (req, res) => {
  try {
    const webhookData = req.body;
    const signature = req.headers["x-payhere-signature"];

    logger.info("Received PayHere payment webhook", {
      data: webhookData,
      signature,
    });

    // Validate webhook signature
    if (!PaymentService.validateWebhookSignature(webhookData, signature)) {
      logger.warn("Invalid PayHere payment webhook signature");
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Handle payment webhook (implementation depends on payment flow)
    // This can be extended to handle booking payment confirmations

    res.status(200).json({
      success: true,
      message: "Payment webhook received",
    });
  } catch (error) {
    logger.error("Error processing PayHere payment webhook", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Payment webhook processing failed",
    });
  }
});

// Health check endpoint for webhook service
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhook service is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
