// 📁 backend/services/notification/refundNotificationService.js
import NotificationTemplate from "../../models/NotificationTemplate.js";
import EmailService from "./emailService.js";
import NotificationService from "./notificationService.js";
import logger from "../../utils/logger.js";

class RefundNotificationService {
  /**
   * Initialize refund notification templates
   */
  async initializeRefundTemplates() {
    const templates = [
      // Refund Request Submitted - Email Template
      {
        type: "refund_request_submitted",
        channel: "email",
        subject: "Refund Request Submitted - {{bookingNumber}}",
        body: `
Dear {{guestName}},

We have received your refund request for booking {{bookingNumber}}.

Refund Details:
- Booking Number: {{bookingNumber}}
- Refund Amount: {{currency}} {{amount}}
- Reason: {{reason}}
- Submitted: {{submittedAt}}

Your refund request has been assigned reference number {{refundId}} and will be reviewed by our team within 24-48 hours.

You will receive email notifications about the status of your refund request.

If you have any questions, please contact our customer service team.

Best regards,
{{hotelName}} Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "reason",
          "submittedAt",
          "refundId",
          "hotelName",
        ],
        defaultPriority: "medium",
      },

      // Refund Request Submitted - In-App Template
      {
        type: "refund_request_submitted",
        channel: "inApp",
        body: "Your refund request for booking {{bookingNumber}} has been submitted successfully. Reference: {{refundId}}",
        variables: ["bookingNumber", "refundId"],
        defaultPriority: "medium",
      },

      // Refund Approved - Email Template
      {
        type: "refund_approved",
        channel: "email",
        subject: "Refund Approved - {{bookingNumber}}",
        body: `
Dear {{guestName}},

Great news! Your refund request for booking {{bookingNumber}} has been approved.

Approved Refund Details:
- Booking Number: {{bookingNumber}}
- Refund Amount: {{currency}} {{amount}}
- Approval Date: {{approvedAt}}
- Approved By: {{approvedBy}}

Your refund will be processed within the next 3-5 business days and credited back to your original payment method.

You will receive a confirmation email once the refund has been processed.

Thank you for choosing {{hotelName}}.

Best regards,
{{hotelName}} Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "approvedAt",
          "approvedBy",
          "hotelName",
        ],
        defaultPriority: "high",
      },

      // Refund Approved - In-App Template
      {
        type: "refund_approved",
        channel: "inApp",
        body: "✅ Your refund request for booking {{bookingNumber}} has been approved! Amount: {{currency}} {{amount}}",
        variables: ["bookingNumber", "amount", "currency"],
        defaultPriority: "high",
      },

      // Refund Denied - Email Template
      {
        type: "refund_denied",
        channel: "email",
        subject: "Refund Request Update - {{bookingNumber}}",
        body: `
Dear {{guestName}},

After careful review, we regret to inform you that your refund request for booking {{bookingNumber}} cannot be approved at this time.

Request Details:
- Booking Number: {{bookingNumber}}
- Requested Amount: {{currency}} {{amount}}
- Review Date: {{deniedAt}}
- Reviewed By: {{deniedBy}}

Reason for Denial:
{{denialReason}}

If you believe this decision was made in error or if you have additional information that may affect this decision, please contact our customer service team who will be happy to review your case.

We appreciate your understanding and apologize for any inconvenience.

Best regards,
{{hotelName}} Customer Service Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "deniedAt",
          "deniedBy",
          "denialReason",
          "hotelName",
        ],
        defaultPriority: "high",
      },

      // Refund Denied - In-App Template
      {
        type: "refund_denied",
        channel: "inApp",
        body: "❌ Your refund request for booking {{bookingNumber}} has been declined. Reason: {{denialReason}}",
        variables: ["bookingNumber", "denialReason"],
        defaultPriority: "high",
      },

      // Refund Processed - Email Template
      {
        type: "refund_processed",
        channel: "email",
        subject: "Refund Processed - {{bookingNumber}}",
        body: `
Dear {{guestName}},

Your refund has been successfully processed!

Refund Details:
- Booking Number: {{bookingNumber}}
- Refund Amount: {{currency}} {{amount}}
- Processing Date: {{processedAt}}
- Transaction Reference: {{transactionRef}}

The refund amount of {{currency}} {{amount}} has been credited back to your original payment method. Please note that it may take {{estimatedArrival}} for the amount to appear in your account, depending on your bank's processing time.

If you don't see the refund in your account after this time, please contact your bank or reach out to our customer service team.

Thank you for your patience and for choosing {{hotelName}}.

Best regards,
{{hotelName}} Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "processedAt",
          "transactionRef",
          "estimatedArrival",
          "hotelName",
        ],
        defaultPriority: "high",
      },

      // Refund Processed - In-App Template
      {
        type: "refund_processed",
        channel: "inApp",
        body: "💰 Your refund of {{currency}} {{amount}} for booking {{bookingNumber}} has been processed successfully!",
        variables: ["bookingNumber", "amount", "currency"],
        defaultPriority: "high",
      },

      // Refund Failed - Email Template
      {
        type: "refund_failed",
        channel: "email",
        subject: "Refund Processing Issue - {{bookingNumber}}",
        body: `
Dear {{guestName}},

We encountered an issue while processing your approved refund for booking {{bookingNumber}}.

Refund Details:
- Booking Number: {{bookingNumber}}
- Refund Amount: {{currency}} {{amount}}
- Issue Date: {{failedAt}}

Issue Description:
{{failureReason}}

Our team is working to resolve this issue and will process your refund as soon as possible. We will keep you updated on the progress.

We sincerely apologize for this inconvenience and appreciate your patience.

If you have any concerns, please don't hesitate to contact our customer service team.

Best regards,
{{hotelName}} Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "failedAt",
          "failureReason",
          "hotelName",
        ],
        defaultPriority: "critical",
      },

      // Refund Failed - In-App Template
      {
        type: "refund_failed",
        channel: "inApp",
        body: "⚠️ Issue processing your refund for booking {{bookingNumber}}. Our team is working to resolve this.",
        variables: ["bookingNumber"],
        defaultPriority: "critical",
      },

      // Refund Info Requested - Email Template
      {
        type: "refund_info_requested",
        channel: "email",
        subject:
          "Additional Information Required - Refund Request {{bookingNumber}}",
        body: `
Dear {{guestName}},

We are reviewing your refund request for booking {{bookingNumber}} and require some additional information to proceed.

Request Details:
- Booking Number: {{bookingNumber}}
- Refund Amount: {{currency}} {{amount}}
- Request Date: {{infoRequestedAt}}

Additional Information Required:
{{infoRequested}}

Please reply to this email with the requested information at your earliest convenience. Once we receive the additional details, we will continue processing your refund request.

If you have any questions about what information is needed, please don't hesitate to contact our customer service team.

Thank you for your cooperation.

Best regards,
{{hotelName}} Customer Service Team
        `,
        variables: [
          "guestName",
          "bookingNumber",
          "amount",
          "currency",
          "infoRequestedAt",
          "infoRequested",
          "hotelName",
        ],
        defaultPriority: "high",
      },

      // Refund Info Requested - In-App Template
      {
        type: "refund_info_requested",
        channel: "inApp",
        body: "📋 Additional information required for your refund request ({{bookingNumber}}). Please check your email for details.",
        variables: ["bookingNumber"],
        defaultPriority: "high",
      },
    ];

    try {
      for (const template of templates) {
        await NotificationTemplate.findOneAndUpdate(
          { type: template.type, channel: template.channel },
          template,
          { upsert: true, new: true }
        );
      }

      logger.info("Refund notification templates initialized successfully", {
        templateCount: templates.length,
      });

      return { success: true, templateCount: templates.length };
    } catch (error) {
      logger.error("Failed to initialize refund notification templates", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Send refund request submitted notification
   */
  async sendRefundRequestSubmitted(guestData, refundData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        reason: refundData.reason,
        submittedAt: new Date(refundData.createdAt).toLocaleDateString(),
        refundId: refundData._id || refundData.refundId,
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_request_submitted",
        channel: "email",
        templateData,
        priority: "medium",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_request_submitted",
        channel: "inApp",
        templateData,
        priority: "medium",
      });

      logger.info("Refund request submitted notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
      });
    } catch (error) {
      logger.error("Failed to send refund request submitted notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }

  /**
   * Send refund approved notification
   */
  async sendRefundApproved(guestData, refundData, approverData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        approvedAt: new Date(refundData.approvedAt).toLocaleDateString(),
        approvedBy: approverData?.name || "Admin Team",
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_approved",
        channel: "email",
        templateData,
        priority: "high",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_approved",
        channel: "inApp",
        templateData,
        priority: "high",
      });

      logger.info("Refund approved notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
        approverId: approverData?._id,
      });
    } catch (error) {
      logger.error("Failed to send refund approved notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }

  /**
   * Send refund denied notification
   */
  async sendRefundDenied(guestData, refundData, denierData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        deniedAt: new Date(refundData.deniedAt).toLocaleDateString(),
        deniedBy: denierData?.name || "Admin Team",
        denialReason: refundData.denialReason,
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_denied",
        channel: "email",
        templateData,
        priority: "high",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_denied",
        channel: "inApp",
        templateData,
        priority: "high",
      });

      logger.info("Refund denied notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
        denierId: denierData?._id,
      });
    } catch (error) {
      logger.error("Failed to send refund denied notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }

  /**
   * Send refund processed notification
   */
  async sendRefundProcessed(guestData, refundData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        processedAt: new Date(refundData.processedAt).toLocaleDateString(),
        transactionRef: refundData.paymentGatewayRef || "Processing",
        estimatedArrival: "3-5 business days",
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_processed",
        channel: "email",
        templateData,
        priority: "high",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_processed",
        channel: "inApp",
        templateData,
        priority: "high",
      });

      logger.info("Refund processed notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
      });
    } catch (error) {
      logger.error("Failed to send refund processed notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }

  /**
   * Send refund failed notification
   */
  async sendRefundFailed(guestData, refundData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        failedAt: new Date().toLocaleDateString(),
        failureReason:
          refundData.failureReason || "Technical issue during processing",
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_failed",
        channel: "email",
        templateData,
        priority: "critical",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_failed",
        channel: "inApp",
        templateData,
        priority: "critical",
      });

      logger.info("Refund failed notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
      });
    } catch (error) {
      logger.error("Failed to send refund failed notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }

  /**
   * Send refund info requested notification
   */
  async sendRefundInfoRequested(guestData, refundData) {
    try {
      const templateData = {
        guestName: guestData.name,
        bookingNumber:
          refundData.bookingId?.bookingNumber || refundData.bookingNumber,
        amount: refundData.amount,
        currency: refundData.currency || "LKR",
        infoRequestedAt: new Date(
          refundData.infoRequestedAt
        ).toLocaleDateString(),
        infoRequested: refundData.infoRequested,
        hotelName: process.env.HOTEL_NAME || "Hotel Management System",
      };

      // Send email notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_info_requested",
        channel: "email",
        templateData,
        priority: "high",
      });

      // Send in-app notification
      await NotificationService.sendTemplatedNotification({
        userId: guestData._id,
        type: "refund_info_requested",
        channel: "inApp",
        templateData,
        priority: "high",
      });

      logger.info("Refund info requested notifications sent", {
        guestId: guestData._id,
        refundId: refundData._id,
      });
    } catch (error) {
      logger.error("Failed to send refund info requested notification", {
        error: error.message,
        guestId: guestData._id,
        refundId: refundData._id,
      });
      throw error;
    }
  }
}

export default new RefundNotificationService();
