// =====================  IMPORTS  ==========================
import nodemailer from "nodemailer";
import { env } from "../config/env.config.js";
import { logger } from "./logger.util.js";

// =====================  TRANSPORTER CONFIG  ================
let transporter = null;

/**
 * Initializes and returns a cached Nodemailer SMTP transporter.
 * Configured with connection pooling for optimal reuse and throughput.
 */
export const getEmailTransporter = () => {
  if (!transporter) {
    const isSecure =
      env.SMTP_SECURE === true ||
      String(env.SMTP_SECURE).toLowerCase() === "true" ||
      Number(env.SMTP_PORT) === 465;

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || "smtp.gmail.com",
      port: Number(env.SMTP_PORT) || 587,
      secure: isSecure,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
  return transporter;
};

// =====================  EMAIL TEMPLATES  ===================

/**
 * Generates modern, responsive HTML email template for password reset.
 *
 * @param {Object} options
 * @param {string} options.userName - Recipient's display name or email.
 * @param {string} options.resetUrl - Actionable reset URL.
 * @returns {string} HTML string.
 */
const buildResetPasswordHtml = ({ userName, resetUrl }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 32px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 12px; background: rgba(255, 255, 255, 0.15); margin-bottom: 12px;">
                <span style="font-size: 28px; line-height: 1;">🏢</span>
              </div>
              <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">
                Flat Maintenance System
              </h1>
              <p style="margin: 0; color: #bfdbfe; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em;">
                Security &amp; Account Recovery
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                Password Reset Request
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Hello <strong>${userName || "User"}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                We received a request to reset the password for your Flat Maintenance account. Click the button below to set up your new credentials:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); transition: background-color 0.2s ease;">
                      Reset Password Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 16px; margin: 24px 0 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5; font-weight: 500;">
                  ⏱️ <strong>Time Sensitive:</strong> This reset link is valid for <strong>15 minutes</strong> and can only be used once.
                </p>
              </div>

              <!-- Fallback Direct Link -->
              <p style="margin: 20px 0 6px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If the button above does not work, copy and paste this link into your web browser:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; word-break: break-all; font-family: monospace; font-size: 12px; color: #2563eb;">
                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">
                  ${resetUrl}
                </a>
              </div>

              <!-- Security Disclaimer -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                  🔒 If you did not request a password reset, you can safely ignore this email. No changes will be made to your account.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Flat Maintenance Management System. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Karachi, Pakistan &bull; Automated System Dispatch
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// =====================  DISPATCH SERVICES  ==================

/**
 * Sends a transactional password reset email to the specified recipient.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address.
 * @param {string} params.resetToken - Raw cryptographically generated reset token.
 * @param {string} [params.userName] - Display name of the user.
 * @returns {Promise<{ success: boolean, messageId?: string, resetUrl: string }>}
 */
export const sendPasswordResetEmail = async ({ to, resetToken, userName }) => {
  const clientBaseUrl =
    env.CLIENT_URL || env.CORS_ORIGIN || "http://localhost:5173";
  const resetUrl = `${clientBaseUrl.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(
    resetToken
  )}`;

  const mailOptions = {
    from: env.SMTP_FROM || `"Flat Maintenance System" <${env.SMTP_USER}>`,
    to,
    subject: "🔐 Reset Your Password — Flat Maintenance System",
    text: `Hello ${userName || "User"},\n\nWe received a request to reset your password. Use the following link to choose a new password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: buildResetPasswordHtml({ userName, resetUrl }),
  };

  try {
    const mailer = getEmailTransporter();
    const info = await mailer.sendMail(mailOptions);

    logger.info("Password reset email dispatched successfully", {
      recipient: to,
      messageId: info.messageId,
    });

    console.log(
      `\n[EMAIL SERVICE] ✅ Reset email successfully sent to: ${to} (MessageId: ${info.messageId})`
    );

    return {
      success: true,
      messageId: info.messageId,
      resetUrl,
    };
  } catch (error) {
    logger.error("Failed to dispatch password reset email via SMTP", {
      recipient: to,
      error: error.message,
    });

    // Provide rich console notification in development so testing is never blocked
    console.warn(
      `\n⚠️ [EMAIL SERVICE WARNING] Could not send reset email via SMTP to ${to}: ${error.message}`
    );
    console.log(`\n======================================================`);
    console.log(`🔑 DEV PASSWORD RESET LINK FOR [${to}]:`);
    console.log(resetUrl);
    console.log(`======================================================\n`);

    // In non-production, return success=false but include resetUrl for frictionless development
    return {
      success: false,
      error: error.message,
      resetUrl,
    };
  }
};

export default {
  getEmailTransporter,
  sendPasswordResetEmail,
};
