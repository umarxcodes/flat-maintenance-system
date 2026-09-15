// =====================  IMPORTS  ==========================
import { z } from "zod";

// =====================  VALIDATION CONSTANTS  ==============
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)";

// =====================  VALIDATION SCHEMAS  =================
/**
 * Validation schema for POST /api/v1/auth/login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
  }),
});

/**
 * Validation schema for POST /api/v1/auth/activate-account
 * FR-AUTH-04: Single-use cryptographic invitation tokens (minimum 32 characters).
 */
export const activateAccountSchema = z.object({
  body: z.object({
    invitationToken: z
      .string()
      .min(32, "Invitation token must be at least 32 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(STRONG_PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE),
  }),
});

/**
 * Validation schema for PATCH /api/v1/auth/change-password
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters")
      .max(128),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128)
      .regex(STRONG_PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE),
  }),
});

/**
 * Validation schema for POST /api/v1/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
  }),
});

/**
 * Validation schema for POST /api/v1/auth/reset-password
 */
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string()
        .min(32, "Password reset token must be at least 32 characters"),
      newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .max(128)
        .regex(STRONG_PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE)
        .optional(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .regex(STRONG_PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE)
        .optional(),
    })
    .refine((data) => Boolean(data.newPassword || data.password), {
      message: "New password is required",
      path: ["newPassword"],
    }),
});
