// =====================  IMPORTS  ==========================
import { z } from "zod";
import { TENANTS_CONSTANTS } from "./tenants.constants.js";

// =====================  REGEX PATTERNS  ====================
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// =====================  SUBDOCUMENT SCHEMAS  ==============
const emergencyContactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.NAME_MIN_LENGTH,
        "Contact name must be at least 2 characters"
      )
      .max(
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.NAME_MAX_LENGTH,
        "Contact name must not exceed 64 characters"
      ),
    relationship: z
      .string()
      .trim()
      .min(
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MIN_LENGTH,
        "Relationship must be at least 2 characters"
      )
      .max(
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MAX_LENGTH,
        "Relationship must not exceed 32 characters"
      ),
    phone: z
      .string()
      .trim()
      .regex(
        E164_PHONE_REGEX,
        "Phone number must adhere to E.164 international format (e.g. +923001234567)"
      ),
  })
  .strict();

// =====================  REQUEST SCHEMAS  ===================
/**
 * Validation schema for POST /api/v1/tenants (Onboard Tenant Lease).
 */
export const createTenantSchema = z.object({
  body: z
    .object({
      userId: z
        .string()
        .regex(OBJECT_ID_REGEX, "userId must be a valid 24-character ObjectId"),
      buildingId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "buildingId must be a valid 24-character ObjectId"
        ),
      flatId: z
        .string()
        .regex(OBJECT_ID_REGEX, "flatId must be a valid 24-character ObjectId"),
      ownerId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "ownerId must be a valid 24-character ObjectId"
        ),
      leaseStartDate: z.coerce.date({
        errorMap: () => ({ message: "leaseStartDate must be a valid date" }),
      }),
      leaseEndDate: z.coerce.date({
        errorMap: () => ({ message: "leaseEndDate must be a valid date" }),
      }),
      rentAmount: z.coerce
        .number({
          invalid_type_error: "rentAmount must be a valid number",
        })
        .min(0, "Rent amount cannot be negative")
        .default(0),
      securityDeposit: z.coerce
        .number({
          invalid_type_error: "securityDeposit must be a valid number",
        })
        .min(0, "Security deposit cannot be negative")
        .optional()
        .default(0),
      emergencyContact: emergencyContactSchema.optional().nullable(),
      policeVerificationStatus: z
        .enum(Object.values(TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS), {
          errorMap: () => ({
            message:
              "policeVerificationStatus must be one of: PENDING, VERIFIED, REJECTED",
          }),
        })
        .optional()
        .default(TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.PENDING),
      status: z
        .enum(Object.values(TENANTS_CONSTANTS.TENANT_STATUS), {
          errorMap: () => ({
            message: "status must be one of: ACTIVE, MOVED_OUT, TERMINATED",
          }),
        })
        .optional()
        .default(TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE),
    })
    .strict()
    .refine((data) => data.leaseEndDate > data.leaseStartDate, {
      message: "leaseEndDate must be strictly after leaseStartDate",
      path: ["leaseEndDate"],
    }),
});

/**
 * Validation schema for GET /api/v1/tenants (Query Tenant Registry).
 */
export const listTenantsQuerySchema = z.object({
  query: z
    .object({
      buildingId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "buildingId must be a valid 24-character ObjectId"
        )
        .optional(),
      flatId: z
        .string()
        .regex(OBJECT_ID_REGEX, "flatId must be a valid 24-character ObjectId")
        .optional(),
      status: z.enum(Object.values(TENANTS_CONSTANTS.TENANT_STATUS)).optional(),
      policeVerificationStatus: z
        .enum(Object.values(TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS))
        .optional(),
      leaseExpiringBefore: z.coerce.date().optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be greater than zero")
        .default(TENANTS_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be greater than zero")
        .max(
          TENANTS_CONSTANTS.PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${TENANTS_CONSTANTS.PAGINATION.MAX_LIMIT}`
        )
        .default(TENANTS_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
    })
    .strict(),
});

/**
 * Validation schema for PATCH /api/v1/tenants/:id/move-out (Checkout Workflow).
 */
export const moveOutTenantSchema = z.object({
  params: z
    .object({
      id: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "Tenant ID must be a valid 24-character hex ObjectId"
        ),
    })
    .strict(),
  body: z
    .object({
      moveOutDate: z.coerce.date().optional(),
    })
    .strict()
    .optional()
    .default({}),
});
