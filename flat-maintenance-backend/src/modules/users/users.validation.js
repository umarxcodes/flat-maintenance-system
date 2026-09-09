// =====================  IMPORTS  ==========================
import { z } from "zod";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { USERS_CONSTANTS } from "./users.constants.js";

// =====================  VALIDATION REGEX  ==================
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// =====================  VALIDATION SCHEMAS  =================
/**
 * Validation schema for POST /api/v1/users/invite
 */
export const inviteUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(64, "First name must not exceed 64 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(64, "Last name must not exceed 64 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    phone: z
      .string()
      .trim()
      .regex(
        E164_PHONE_REGEX,
        "Phone number must adhere to E.164 international format (e.g. +923001234567)"
      ),
    role: z.enum(Object.values(ROLES), {
      errorMap: () => ({ message: "Invalid role specified" }),
    }),
    assignedBuildingIds: z
      .array(
        z
          .string()
          .regex(
            OBJECT_ID_REGEX,
            "Each building ID must be a valid 24-character ObjectId"
          )
      )
      .optional()
      .default([]),
  }),
});

/**
 * Validation schema for GET /api/v1/users (Query parameters)
 */
export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(USERS_CONSTANTS.DEFAULT_PAGE),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(USERS_CONSTANTS.MAX_LIMIT)
      .default(USERS_CONSTANTS.DEFAULT_LIMIT),
    role: z.enum(Object.values(ROLES)).optional(),
    status: z.enum(Object.values(ACCOUNT_STATUS)).optional(),
    buildingId: z
      .string()
      .regex(
        OBJECT_ID_REGEX,
        "buildingId must be a valid 24-character ObjectId"
      )
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
});

/**
 * Validation schema for route parameter: :id
 */
export const userIdParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(OBJECT_ID_REGEX, "User ID must be a valid 24-character ObjectId"),
  }),
});

/**
 * Validation schema for PATCH /api/v1/users/:id/status
 */
export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(OBJECT_ID_REGEX, "User ID must be a valid 24-character ObjectId"),
  }),
  body: z.object({
    status: z.enum(
      [
        ACCOUNT_STATUS.ACTIVE,
        ACCOUNT_STATUS.SUSPENDED,
        ACCOUNT_STATUS.INACTIVE,
      ],
      {
        errorMap: () => ({
          message: "Status must be one of: ACTIVE, SUSPENDED, INACTIVE",
        }),
      }
    ),
  }),
});

/**
 * Validation schema for PATCH /api/v1/users/profile
 * Mass-assignment protection: restricts mutation strictly to personal profile metadata.
 */
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(64).optional(),
    lastName: z.string().trim().min(2).max(64).optional(),
    phone: z
      .string()
      .trim()
      .regex(
        E164_PHONE_REGEX,
        "Phone number must adhere to E.164 international format (e.g. +923001234567)"
      )
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .url("avatarUrl must be a valid URL")
      .optional()
      .nullable(),
  }),
});
