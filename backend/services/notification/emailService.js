import nodemailer from "nodemailer";
import mongoose from "mongoose";
import AdminSettings from "../../models/AdminSettings.js";

const isEmailEnabled = process.env.EMAIL_ENABLED !== "false"; // Default to true if not set
let transporter = null;
let isInitializing = false;
let initializationPromise = null;

const initializeTransporter = async (forceReinitialize = false) => {
  if (!isEmailEnabled) {
    console.log("📧 Email service is disabled (EMAIL_ENABLED=false)");
    return null;
  }

  // If already initializing, return the existing promise to prevent multiple initializations
  if (isInitializing && initializationPromise && !forceReinitialize) {
    console.log("📧 Email transporter initialization already in progress...");
    return initializationPromise;
  }

  // If we already have a transporter and not forcing reinitialization, return it
  if (transporter && !forceReinitialize) {
    return transporter;
  }

  // Create a new promise for the initialization
  initializationPromise = (async () => {
    isInitializing = true;
    console.log("🔧 Initializing email transporter...");
    
    try {
      console.log("🔍 Checking MongoDB connection state...");
      if (mongoose.connection.readyState !== 1) {
        const error = new Error("MongoDB connection not ready");
        console.warn(error.message);
        throw error;
      }

      const settings = await AdminSettings.findOne().lean();
      if (!settings) {
        const error = new Error("No settings found in database");
        console.warn(error.message);
        throw error;
      }

      // Get SMTP config from environment variables or database
      const smtpConfig = {
        // Use environment variables if available, otherwise use database settings
        host: process.env.SMTP_HOST || settings?.smtpHost,
        port: parseInt(process.env.SMTP_PORT, 10) || settings?.smtpPort || 587,
        secure: process.env.SMTP_SECURE === "true" || settings?.smtpSecure || false,
        tls: {
          rejectUnauthorized: false // For self-signed certificates
        },
        debug: true, // Enable debug logging
        logger: true // Enable logging with console.log
      };

      // Handle authentication separately to ensure proper password handling
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use environment variables for auth
        smtpConfig.auth = {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        };
      } else if (settings?.smtpUser) {
        // Use database settings for auth
        // Create a new AdminSettings instance to trigger the getter for password decryption
        const settingsInstance = new AdminSettings(settings);
        const decryptedPassword = settingsInstance.smtpPassword;
        
        smtpConfig.auth = {
          user: settings.smtpUser,
          pass: decryptedPassword
        };
      }

      // Remove auth if credentials are not provided
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        console.warn("⚠️ SMTP credentials not provided, email sending will be disabled");
        smtpConfig.auth = undefined;
      }

      console.log("🔧 SMTP Configuration:", {
        connection: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          tlsRejectUnauthorized: smtpConfig.tls?.rejectUnauthorized
        },
        authentication: {
          enabled: !!smtpConfig.auth,
          user: smtpConfig.auth?.user || 'not configured',
          passLength: smtpConfig.auth?.pass ? `${smtpConfig.auth.pass.length} chars` : 'not set',
          source: {
            host: process.env.SMTP_HOST ? 'env' : 'db',
            user: process.env.SMTP_USER ? 'env' : 'db',
            pass: process.env.SMTP_PASS ? 'env' : 'db',
            port: process.env.SMTP_PORT ? 'env' : 'db',
            secure: process.env.SMTP_SECURE ? 'env' : 'db'
          }
        },
        debug: {
          enabled: smtpConfig.debug,
          logger: smtpConfig.logger ? 'enabled' : 'disabled'
        }
      });
      
      if (smtpConfig.auth?.pass) {
        console.log("🔑 Password decryption:", {
          isEncrypted: smtpConfig.auth.pass.includes(':') ? 'yes' : 'no',
          firstChars: smtpConfig.auth.pass.substring(0, 2) + '...',
          lastChars: '...' + smtpConfig.auth.pass.slice(-2)
        });
      }

      const requiredFields = ["host", "port"];
      if (smtpConfig.auth) {
        requiredFields.push("auth.user", "auth.pass");
      }
      
      const missingFields = requiredFields.filter(
        (field) => !field.split(".").reduce((obj, key) => obj?.[key], smtpConfig)
      );

      if (missingFields.length > 0) {
        const error = new Error(`Missing required SMTP configuration: ${missingFields.join(", ")}`);
        console.error("❌ SMTP configuration error:", error.message);
        throw error;
      }

      // Create the transporter
      transporter = nodemailer.createTransport(smtpConfig);
      
      // Verify the connection configuration
      try {
        await transporter.verify();
        console.log("✅ SMTP server is ready to send emails");
        return transporter;
      } catch (verifyError) {
        console.error("❌ SMTP connection verification failed:", verifyError);
        throw verifyError;
      }
    } catch (error) {
      console.error("Failed to initialize email transporter:", {
        message: error.message,
        stack: error.stack,
      });
      return null;
    } finally {
      isInitializing = false;
    }
  })();

  return initializationPromise;
};

class EmailService {
  // Base email sending method
  static async sendEmail({ to, subject, html, text }) {
    if (!isEmailEnabled) {
      console.warn("📧 Email sending is disabled (EMAIL_ENABLED=false)");
      return { success: false, message: "Email sending is disabled" };
    }

    try {
      // Ensure transporter is initialized
      if (!transporter) {
        console.log("📧 Initializing email transporter before sending...");
        await initializeTransporter();
      }

      if (!transporter) {
        throw new Error("❌ Email transporter could not be initialized");
      }

      if (!to || !subject || (!html && !text)) {
        throw new Error("Missing required email parameters");
      }

      // Get the latest settings in case they were updated
      const settings = await AdminSettings.findOne().lean();
      const from = settings?.smtpFrom || process.env.SMTP_FROM || 'noreply@hotel.com';
      const hotelName = settings?.hotelName || 'Hotel Management';

      console.log(`📨 Sending email to: ${to}`);
      console.log(`📝 Subject: ${subject}`);
      
      const mailOptions = {
        from: `"${hotelName}" <${from}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text: text || (html ? html.replace(/<[^>]*>/g, '') : ''), // Convert HTML to plain text if no text provided
        html: html || text, // Use text as HTML if no HTML provided
        envelope: {
          from: `"${hotelName}" <${from}>`,
          to: Array.isArray(to) ? to[0] : to
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Message sent: %s", info.messageId);
        
        // If using ethereal.email, log the preview URL
        if (info.envelope.from.includes('ethereal.email')) {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log("📧 Preview URL: %s", previewUrl);
        }

        return { 
          success: true, 
          messageId: info.messageId,
          previewUrl: nodemailer.getTestMessageUrl(info)
        };
      } catch (sendError) {
        console.error("❌ Failed to send email:", sendError);
        
        // If the error is related to authentication or connection, try to reinitialize the transporter
        if (sendError.code === 'EAUTH' || sendError.code === 'ECONNECTION') {
          console.log("🔄 Attempting to reinitialize transporter after error...");
          try {
            await this.reinitializeTransporter();
            // Retry sending the email
            console.log("🔄 Retrying to send email after reinitialization...");
            const retryInfo = await transporter.sendMail(mailOptions);
            console.log("✅ Message sent successfully after retry:", retryInfo.messageId);
            return { 
              success: true, 
              messageId: retryInfo.messageId,
              previewUrl: nodemailer.getTestMessageUrl(retryInfo)
            };
          } catch (retryError) {
            console.error("❌ Failed to send email after retry:", retryError);
            throw new Error(`Failed to send email after retry: ${retryError.message}`);
          }
        }
        
        throw sendError;
      }
    } catch (error) {
      console.error("❌ Error in sendEmail:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Test email configuration with provided settings
  static async testEmailConfig({
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    smtpFrom,
    smtpSecure,
  }) {
    if (!isEmailEnabled) {
      throw new Error("Email service is disabled");
    }
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
      throw new Error("Missing required email configuration parameters");
    }
    try {
      const testTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPassword },
      });
      await testTransporter.verify();
      const info = await testTransporter.sendMail({
        from: `"Hotel Management System" <${smtpFrom}>`,
        to: smtpFrom, // Send to the from email for testing
        subject: "Test Email from Hotel Management System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Email</h2>
            <p>This is a test email to verify your SMTP configuration.</p>
            <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
          </div>
        `,
      });
      console.log("📧 Test email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("❌ Test email failed:", error);
      throw error;
    }
  }

  // Reinitialize transporter after settings update
  static async reinitializeTransporter() {
    console.log("🔄 Reinitializing email transporter...");
    try {
      // Close existing transporter if it exists
      if (transporter) {
        try {
          await transporter.close();
          console.log("✅ Closed existing transporter");
        } catch (closeError) {
          console.warn("⚠️ Error closing existing transporter:", closeError.message);
        }
      }
      
      // Reset transporter and force reinitialization
      transporter = null;
      const newTransporter = await initializeTransporter(true);
      console.log("✅ Email transporter reinitialized successfully");
      return newTransporter;
    } catch (error) {
      console.error("❌ Failed to reinitialize email transporter:", error);
      throw error;
    }
  }

  // Existing email methods (unchanged)
  static async sendVerificationEmail(user, otpCode) {
    const subject = "Verify Your Email Address";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Email Verification</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with our Hotel Management System. Please use the following OTP to verify your email address:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">${otpCode}</p>
        <p>This code will expire in 10 minutes.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = "Password Reset Request";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}"
             style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendAdminNotificationEmail(
    admin,
    { subject, userName, userEmail, userRole }
  ) {
    const approvalUrl = `${process.env.ADMIN_PANEL_URL}/users/pending`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${subject}</h2>
        <p>Hello Admin,</p>
        <p>A new user requires your approval:</p>
        <ul>
          <li><strong>Name:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Role:</strong> ${userRole}</li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="${approvalUrl}"
             style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Review Pending Approvals
          </a>
        </p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management System</p>
      </div>
    `;
    return this.sendEmail({ to: admin.email, subject, html });
  }

  static async sendWelcomeEmail(user, role) {
    const subject = `Welcome to Hotel Management System as ${role}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome, ${user.name}!</h2>
        <p>Your ${role} account has been successfully created in our Hotel Management System.</p>
        <p>You can now log in using your email address: ${user.email}</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendApprovalEmail(user) {
    const subject = `Account Approved - Hotel Management System`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Account Approved</h2>
        <p>Dear ${user.name},</p>
        <p>Your ${user.role} account has been approved and is now active.</p>
        <p>You can now access all the features available for your role.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendInvitationEmail(email, role, token, expiresInHours) {
    const subject = `Invitation to Join as ${role}`;
    // Import config to get FRONTEND_URL
    const config = (await import('../../config/environment.js')).default;
    const baseUrl = config.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${baseUrl}/accept-invitation?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">You're Invited!</h2>
        <p>You've been invited to join our Hotel Management System as a ${role}.</p>
        <p>This invitation will expire in ${expiresInHours} hours.</p>
        <p style="margin: 20px 0;">
          <a href="${invitationLink}"
             style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy this link: ${invitationLink}</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: email, subject, html });
  }

  static async sendDeactivationEmail(user, reason) {
    const subject = `Account Deactivated - Hotel Management System`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Account Deactivated</h2>
        <p>Dear ${user.name},</p>
        <p>Your account has been deactivated for the following reason:</p>
        <p style="font-style: italic;">${reason || "No reason provided"}</p>
        <p>If you believe this was an error, please contact support.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendReactivationEmail(user) {
    const subject = `Account Reactivated - Hotel Management System`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Account Reactivated</h2>
        <p>Dear ${user.name},</p>
        <p>Your account has been reactivated and you can now access the system.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }

  static async sendAdminPasswordResetEmail(user, temporaryPassword) {
    const subject = "Password Reset by Administrator - Hotel Management System";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c0392b;">Password Reset Notification</h2>
        <p>Dear ${user.name},</p>
        <p>Your password has been reset by an administrator. Your temporary password is:</p>
        <p style="font-size: 18px; font-weight: bold; color: #2c3e50;">${temporaryPassword}</p>
        <p>Please <a href="${process.env.APP_URL}/login" style="color: #2980b9;">log in</a> and change your password immediately to ensure account security.</p>
        <p style="margin-top: 30px;">Best regards,<br/>Hotel Management Team</p>
      </div>
    `;
    return this.sendEmail({ to: user.email, subject, html });
  }
}

export default EmailService;
