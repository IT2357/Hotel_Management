import nodemailer from "nodemailer";
import mongoose from "mongoose";
import AdminSettings from "../../models/AdminSettings.js";

const isEmailEnabled = process.env.EMAIL_ENABLED === "true";

let transporter = null;
let isInitializing = false;

const getTransporter = async () => {
  if (transporter) return transporter;
  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    return transporter;
  }
  
  isInitializing = true;
  try {
    transporter = await initializeTransporter();
    return transporter;
  } finally {
    isInitializing = false;
  }
};

const initializeTransporter = async () => {
  if (!isEmailEnabled) {
    console.log("📧 Email service is disabled (EMAIL_ENABLED=false)");
    return null;
  }

  try {
    const settings = await AdminSettings.findOne().lean();
    const smtpConfig = {
      host: settings?.smtpHost || process.env.SMTP_HOST,
      port: settings?.smtpPort || parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: settings?.smtpSecure ?? (process.env.SMTP_SECURE === "true"),
      auth: {
        user: settings?.smtpUser || process.env.SMTP_USER,
        pass: settings?.smtpPassword || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Only for development
      }
    };

    console.log("Initializing email transporter with:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
    });

    const requiredFields = ["host", "port", "auth.user", "auth.pass"];
    const missingFields = requiredFields.filter(
      (field) => !field.split(".").reduce((obj, key) => obj?.[key], smtpConfig)
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing email configuration: ${missingFields.join(", ")}`);
    }

    const newTransporter = nodemailer.createTransport(smtpConfig);
    
    // Test the connection
    await newTransporter.verify();
    console.log("✅ SMTP server is ready to send emails");
    return newTransporter;
  } catch (error) {
    console.error("Failed to initialize email transporter:", {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
};

class EmailService {
  // Base email sending method
  static async sendEmail({ to, subject, html, text }) {
    try {
      const currentTransporter = await getTransporter();
      if (!currentTransporter) {
        throw new Error("Email transporter not configured");
      }
      
      const from = process.env.SMTP_FROM;
      const info = await currentTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      });
      
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
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
    transporter = await initializeTransporter();
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
