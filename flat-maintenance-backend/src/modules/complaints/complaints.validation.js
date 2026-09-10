// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  COMPLAINT_TYPE,
  COMPLAINT_STATUS,
  COMPLAINT_LIMITS,
  COMPLAINTS_PAGINATION,
} from "./complaints.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/complaints
 */
export const createComplaintSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      flatId: objectIdSchema,
      type: z.enum(Object.values(COMPLAINT_TYPE), {
        message: `Invalid complaint type. Allowed types: ${Object.values(COMPLAINT_TYPE).join(", ")}`,
      }),
      title: z
        .string({ required_error: "Complaint title is required" })
        .trim()
        .min(
          COMPLAINT_LIMITS.TITLE_MIN_LENGTH,
          `Title must be at least ${COMPLAINT_LIMITS.TITLE_MIN_LENGTH} characters`
        )
        .max(
          COMPLAINT_LIMITS.TITLE_MAX_LENGTH,
          `Title cannot exceed ${COMPLAINT_LIMITS.TITLE_MAX_LENGTH} characters`
        ),
      description: z
        .string({ required_error: "Complaint description is required" })
        .trim()
        .min(
          COMPLAINT_LIMITS.DESCRIPTION_MIN_LENGTH,
          `Description must be at least ${COMPLAINT_LIMITS.DESCRIPTION_MIN_LENGTH} characters`
        )
        .max(
          COMPLAINT_LIMITS.DESCRIPTION_MAX_LENGTH,
          `Description cannot exceed ${COMPLAINT_LIMITS.DESCRIPTION_MAX_LENGTH} characters`
        ),
    })
    .strict({
      message:
        "Extraneous fields or mass-assignment payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/complaints
 */
export const listComplaintsQuerySchema = z.object({
  query: z
    .object({
      status: z
        .enum(Object.values(COMPLAINT_STATUS), {
          message: `Invalid status filter. Allowed statuses: ${Object.values(COMPLAINT_STATUS).join(", ")}`,
        })
        .optional(),
      type: z
        .enum(Object.values(COMPLAINT_TYPE), {
          message: `Invalid type filter. Allowed types: ${Object.values(COMPLAINT_TYPE).join(", ")}`,
        })
        .optional(),
      buildingId: objectIdSchema.optional(),
      flatId: objectIdSchema.optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(COMPLAINTS_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          COMPLAINTS_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${COMPLAINTS_PAGINATION.MAX_LIMIT}`
        )
        .default(COMPLAINTS_PAGINATION.DEFAULT_LIMIT),
    })
    .strict({ message: "Extraneous query parameters rejected" }),
});

/**
 * Validation schema for routes with :id parameter (GET /:id)
 */
export const complaintIdParamSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});

/**
 * Validation schema for PATCH /api/v1/complaints/:id/resolve
 */
export const resolveComplaintSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({
      resolutionNotes: z
        .string({ required_error: "resolutionNotes is required" })
        .trim()
        .min(
          COMPLAINT_LIMITS.RESOLUTION_NOTES_MIN_LENGTH,
          `resolutionNotes must be at least ${COMPLAINT_LIMITS.RESOLUTION_NOTES_MIN_LENGTH} characters`
        )
        .max(
          COMPLAINT_LIMITS.RESOLUTION_NOTES_MAX_LENGTH,
          `resolutionNotes cannot exceed ${COMPLAINT_LIMITS.RESOLUTION_NOTES_MAX_LENGTH} characters`
        ),
    })
    .strict({ message: "Extraneous fields or mass-assignment rejected" }),
});
