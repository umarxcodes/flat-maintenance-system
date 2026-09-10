// =====================  IMPORTS  ==========================
import { z } from "zod";
import {
  INVOICE_STATUS,
  BILLING_PERIOD_REGEX,
  INVOICES_PAGINATION,
} from "./invoices.constants.js";

// =====================  COMMON SCHEMAS  ====================
const objectIdSchema = z
  .string({ required_error: "MongoDB ObjectId is required" })
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId format (must be 24-character hex string)"
  );

const billingPeriodSchema = z
  .string({ required_error: "Billing period is required" })
  .trim()
  .regex(
    BILLING_PERIOD_REGEX,
    "Billing period must match format YYYY-MM (e.g. 2026-09)"
  );

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/invoices/generate-batch
 */
export const generateBatchSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      billingPeriod: billingPeriodSchema,
      dueDate: z
        .string()
        .datetime({ message: "dueDate must be a valid ISO 8601 date string" })
        .optional(),
      status: z
        .enum([INVOICE_STATUS.DRAFT, INVOICE_STATUS.ISSUED], {
          errorMap: () => ({
            message: `Batch status must be either '${INVOICE_STATUS.DRAFT}' or '${INVOICE_STATUS.ISSUED}'`,
          }),
        })
        .optional(),
    })
    .strict({
      message:
        "Extraneous fields or mass-assignment payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/invoices (Listing with filters)
 */
export const listInvoicesQuerySchema = z.object({
  query: z
    .object({
      status: z
        .enum(Object.values(INVOICE_STATUS), {
          errorMap: () => ({
            message: `Invalid status filter. Allowed: ${Object.values(INVOICE_STATUS).join(", ")}`,
          }),
        })
        .optional(),
      buildingId: objectIdSchema.optional(),
      flatId: objectIdSchema.optional(),
      billingPeriod: z
        .string()
        .trim()
        .regex(
          BILLING_PERIOD_REGEX,
          "Billing period filter must match format YYYY-MM"
        )
        .optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(INVOICES_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          INVOICES_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${INVOICES_PAGINATION.MAX_LIMIT}`
        )
        .default(INVOICES_PAGINATION.DEFAULT_LIMIT),
    })
    .strict({ message: "Extraneous query parameters rejected" }),
});

/**
 * Validation schema for routes with :id parameter (GET /:id, PATCH /:id/void)
 */
export const invoiceIdParamSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});
