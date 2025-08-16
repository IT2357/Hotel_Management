// 📁 backend/services/notification/emailService.js
import nodemailer from "nodemailer";
import { User } from "../../models/User.js";

// Check if email service is enabled
const isEmailEnabled = process.env.EMAIL_ENABLED === "true";

// Initialize transporter only if email is enabled and all required vars are present
let transporter = null;

if (isEmailEnabled) {
  // Validate required environment variables
  const requiredEnvVars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
  ];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required email configuration: ${missingVars.join(", ")}`
    );
    console.warn(
      "⚠️ Email service will be disabled due to missing configuration"
    );
  } else {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection configuration
      transporter.verify((error, success) => {
        if (error) {
          console.error("❌ SMTP connection verification failed:", error);
          transporter = null;
        } else {
          console.log("✅ SMTP server is ready to send emails");
        }
      });
    } catch (error) {
      console.error("❌ Failed to create email transporter:", error);
      transporter = null;
    }
  }
} else {
  console.log("📧 Email service is disabled (EMAIL_ENABLED=false)");
}

class EmailService {
  // Base email sending method
  static async sendEmail({ to, subject, html, text }) {
    if (!isEmailEnabled) {
      throw new Error("Email service is disabled");
    }

    if (!transporter) {
      throw new Error("Email transporter not configured");
    }

    if (!to || !subject || (!html && !text)) {
      throw new Error("Missing required email parameters");
    }

    try {
      const mailOptions = {
        from: `"Hotel Management System" <${process.env.SMTP_FROM}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("📧 Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      throw error;
    }
  }

  // Send verification email with OTP
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

  // Send password reset email
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

  // Send admin notification about pending approval
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

  // Send welcome email (used in authService)
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

  // Send approval email (used in authService)
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

  // Send invitation email (used in authService)
  static async sendInvitationEmail(email, role, token, expiresInHours) {
    const subject = `Invitation to Join as ${role}`;
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
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
}

export default EmailService;
