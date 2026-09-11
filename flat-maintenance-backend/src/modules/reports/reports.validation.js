// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import { BILLING_PERIOD_REGEX } from "./reports.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string({ required_error: "buildingId parameter is required" })
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format for buildingId",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Zero-Trust validation for GET /api/v1/reports/maintenance-collections
 */
export const maintenanceCollectionsQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema,
      period: z
        .string({ required_error: "period parameter (YYYY-MM) is required" })
        .trim()
        .regex(
          BILLING_PERIOD_REGEX,
          "Billing period must strictly match format YYYY-MM (e.g. 2026-09)"
        ),
    })
    .strict({ message: "Unrecognized query parameters detected" }),
});

/**
 * Zero-Trust validation for GET /api/v1/reports/staff-performance
 */
export const staffPerformanceQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema,
    })
    .strict({ message: "Unrecognized query parameters detected" }),
});

/**
 * Zero-Trust validation for GET /api/v1/reports/complaint-sla
 */
export const complaintSlaQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema,
    })
    .strict({ message: "Unrecognized query parameters detected" }),
});
