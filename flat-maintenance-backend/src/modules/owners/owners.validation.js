// =====================  IMPORTS  ==========================
import { z } from "zod";
import { OWNERS_CONSTANTS } from "./owners.constants.js";
import { isCloudinaryUrl } from "../../utils/cloudinary.util.js";

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
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.NAME_MIN_LENGTH,
        "Contact name must be at least 2 characters"
      )
      .max(
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.NAME_MAX_LENGTH,
        "Contact name must not exceed 64 characters"
      ),
    relationship: z
      .string()
      .trim()
      .min(
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MIN_LENGTH,
        "Relationship must be at least 2 characters"
      )
      .max(
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MAX_LENGTH,
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
 * Validation schema for POST /api/v1/owners (Register Owner Profile).
 */
export const createOwnerSchema = z.object({
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
      flatsOwned: z
        .array(
          z
            .string()
            .regex(
              OBJECT_ID_REGEX,
              "Each flat ID must be a valid 24-character ObjectId"
            )
        )
        .optional()
        .default([]),
      emergencyContact: emergencyContactSchema.optional().nullable(),
      idProofType: z
        .enum(Object.values(OWNERS_CONSTANTS.ID_PROOF_TYPES), {
          errorMap: () => ({
            message:
              "idProofType must be one of: PASSPORT, NATIONAL_ID, DRIVING_LICENSE",
          }),
        })
        .optional()
        .nullable(),
      idProofUrl: z
        .string()
        .trim()
        .refine(
          (url) => !url || isCloudinaryUrl(url),
          "idProofUrl must be a valid Cloudinary HTTPS CDN URL (res.cloudinary.com)"
        )
        .optional()
        .nullable(),
      isResidingInBuilding: z.boolean().optional().default(false),
    })
    .strict()
    .refine(
      (data) => {
        // If idProofType is provided, idProofUrl should be provided, and vice versa
        if (data.idProofType && !data.idProofUrl) {
          return false;
        }
        if (data.idProofUrl && !data.idProofType) {
          return false;
        }
        return true;
      },
      {
        message:
          "Both idProofType and idProofUrl must be provided together when submitting identity proof",
        path: ["idProofUrl"],
      }
    ),
});

/**
 * Validation schema for GET /api/v1/owners (Owner Registry Listing & Filtering).
 */
export const listOwnersQuerySchema = z.object({
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
      isResidingInBuilding: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be greater than zero")
        .default(OWNERS_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be greater than zero")
        .max(
          OWNERS_CONSTANTS.PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${OWNERS_CONSTANTS.PAGINATION.MAX_LIMIT}`
        )
        .default(OWNERS_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
    })
    .strict(),
});

/**
 * Validation schema for GET /api/v1/owners/:id (Owner Details & Portfolio).
 */
export const getOwnerByIdSchema = z.object({
  params: z
    .object({
      id: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "Owner ID must be a valid 24-character hex ObjectId"
        ),
    })
    .strict(),
});
