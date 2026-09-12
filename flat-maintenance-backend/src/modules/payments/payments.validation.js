// =====================  IMPORTS  ==========================
import { z } from "zod";
import { PAYMENT_METHODS, PAYMENT_LIMITS } from "./payments.constants.js";

// =====================  COMMON SCHEMAS  ====================
const objectIdSchema = z
  .string({ required_error: "MongoDB ObjectId is required" })
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId format (must be 24-character hex string)"
  );

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/payments
 *
 * Strict Zero-Trust validation:
 * Disallows mass-assignment of server-owned fields such as paymentNumber,
 * receiptNumber, buildingId, flatId, payerUserId, receiptPdfUrl, paymentDate,
 * status, paidAmount, dueAmount.
 */
export const executePaymentSchema = z.object({
  body: z
    .object({
      invoiceId: objectIdSchema,
      amount: z
        .number({ required_error: "Payment amount is required" })
        .positive("Payment amount must be strictly greater than 0")
        .finite("Payment amount must be a finite number"),
      paymentMethod: z.enum(Object.values(PAYMENT_METHODS), {
        errorMap: () => ({
          message: `Invalid paymentMethod. Allowed: ${Object.values(PAYMENT_METHODS).join(", ")}`,
        }),
      }),
      transactionRef: z
        .string()
        .trim()
        .max(100, "Transaction reference cannot exceed 100 characters")
        .optional(),
      notes: z
        .string()
        .trim()
        .max(500, "Notes cannot exceed 500 characters")
        .optional(),
    })
    .strict({
      message:
        "Extraneous fields or mass-assignment payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/payments (Ledger queries)
 */
export const listPaymentsQuerySchema = z.object({
  query: z
    .object({
      invoiceId: objectIdSchema.optional(),
      buildingId: objectIdSchema.optional(),
      flatId: objectIdSchema.optional(),
      paymentMethod: z.enum(Object.values(PAYMENT_METHODS)).optional(),
      transactionRef: z.string().trim().optional(),
      paymentNumber: z.string().trim().optional(),
      receiptNumber: z.string().trim().optional(),
      startDate: z
        .string()
        .datetime({ message: "startDate must be a valid ISO 8601 date string" })
        .optional(),
      endDate: z
        .string()
        .datetime({ message: "endDate must be a valid ISO 8601 date string" })
        .optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be at least 1")
        .default(PAYMENT_LIMITS.DEFAULT_PAGE)
        .optional(),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          PAYMENT_LIMITS.MAX_LIMIT,
          `Limit cannot exceed ${PAYMENT_LIMITS.MAX_LIMIT}`
        )
        .default(PAYMENT_LIMITS.DEFAULT_LIMIT)
        .optional(),
    })
    .strict({
      message: "Extraneous query parameters are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/payments/:id/receipt
 */
export const paymentIdParamSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});
