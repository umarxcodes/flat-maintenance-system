// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import { AUDIT_LOG_LIMITS } from "./audit-logs.constants.js";

// =====================  HELPERS  ============================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  QUERY VALIDATION SCHEMA  ===========
/**
 * Zero-Trust query parameter validation schema for GET /api/v1/audit-logs.
 */
export const listAuditLogsQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema.optional(),
      resourceType: z.string().trim().toUpperCase().optional(),
      resourceId: objectIdSchema.optional(),
      actorUserId: objectIdSchema.optional(),
      action: z.string().trim().toUpperCase().optional(),
      from: z
        .string()
        .trim()
        .refine((val) => !Number.isNaN(Date.parse(val)), {
          message:
            "Invalid date format for 'from' parameter (ISO-8601 expected)",
        })
        .optional(),
      to: z
        .string()
        .trim()
        .refine((val) => !Number.isNaN(Date.parse(val)), {
          message: "Invalid date format for 'to' parameter (ISO-8601 expected)",
        })
        .optional(),
      page: z.coerce
        .number()
        .int({ message: "Page must be an integer" })
        .min(1, { message: "Page must be greater than or equal to 1" })
        .default(AUDIT_LOG_LIMITS.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int({ message: "Limit must be an integer" })
        .min(1, { message: "Limit must be at least 1" })
        .max(AUDIT_LOG_LIMITS.MAX_LIMIT, {
          message: `Limit cannot exceed ${AUDIT_LOG_LIMITS.MAX_LIMIT}`,
        })
        .default(AUDIT_LOG_LIMITS.DEFAULT_LIMIT),
    })
    .strict({ message: "Unrecognized query parameters detected" }),
});
