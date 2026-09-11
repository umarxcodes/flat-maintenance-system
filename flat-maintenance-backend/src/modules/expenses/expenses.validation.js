// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  EXPENSE_CATEGORY,
  EXPENSE_STATUS,
  EXPENSE_LIMITS,
  EXPENSE_PAGINATION,
} from "./expenses.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/expenses
 */
export const createExpenseSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      title: z
        .string({ required_error: "Expense title is required" })
        .trim()
        .min(
          EXPENSE_LIMITS.TITLE_MIN_LENGTH,
          `Title must be at least ${EXPENSE_LIMITS.TITLE_MIN_LENGTH} characters`
        )
        .max(
          EXPENSE_LIMITS.TITLE_MAX_LENGTH,
          `Title cannot exceed ${EXPENSE_LIMITS.TITLE_MAX_LENGTH} characters`
        ),
      vendorName: z
        .string({ required_error: "Vendor name is required" })
        .trim()
        .min(
          EXPENSE_LIMITS.VENDOR_MIN_LENGTH,
          `Vendor name must be at least ${EXPENSE_LIMITS.VENDOR_MIN_LENGTH} characters`
        )
        .max(
          EXPENSE_LIMITS.VENDOR_MAX_LENGTH,
          `Vendor name cannot exceed ${EXPENSE_LIMITS.VENDOR_MAX_LENGTH} characters`
        ),
      category: z.enum(Object.values(EXPENSE_CATEGORY), {
        message: `Invalid category. Allowed values: ${Object.values(EXPENSE_CATEGORY).join(", ")}`,
      }),
      amount: z
        .number({ required_error: "Expense amount is required" })
        .positive("Expense amount must be strictly positive")
        .min(
          EXPENSE_LIMITS.AMOUNT_MIN,
          `Expense amount must be at least ${EXPENSE_LIMITS.AMOUNT_MIN}`
        )
        .max(
          EXPENSE_LIMITS.AMOUNT_MAX,
          `Expense amount cannot exceed ${EXPENSE_LIMITS.AMOUNT_MAX}`
        )
        .refine(
          (val) => Number.isFinite(val) && Math.round(val * 100) === val * 100,
          "Expense amount cannot have more than 2 decimal places"
        ),
      receiptUrl: z
        .string()
        .trim()
        .url("Invalid receipt URL format")
        .optional()
        .nullable(),
      expenseDate: z.coerce.date({
        required_error: "Expense date is required",
        invalid_type_error: "Invalid expense date format",
      }),
    })
    .strict({
      message:
        "Extraneous fields, mass assignment, or status injection payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/expenses
 */
export const listExpensesQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema.optional(),
      category: z
        .enum(Object.values(EXPENSE_CATEGORY), {
          message: `Invalid category. Allowed values: ${Object.values(EXPENSE_CATEGORY).join(", ")}`,
        })
        .optional(),
      status: z
        .enum(Object.values(EXPENSE_STATUS), {
          message: `Invalid status. Allowed values: ${Object.values(EXPENSE_STATUS).join(", ")}`,
        })
        .optional(),
      fromDate: z.coerce.date().optional(),
      toDate: z.coerce.date().optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(EXPENSE_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          EXPENSE_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${EXPENSE_PAGINATION.MAX_LIMIT}`
        )
        .default(EXPENSE_PAGINATION.DEFAULT_LIMIT),
    })
    .strict({ message: "Extraneous query parameters rejected" })
    .refine(
      (data) => {
        if (data.fromDate && data.toDate) {
          return data.fromDate <= data.toDate;
        }
        return true;
      },
      {
        message: "fromDate must be less than or equal to toDate",
        path: ["fromDate"],
      }
    ),
});

/**
 * Validation schema for PATCH /api/v1/expenses/:id/approve
 */
export const approveExpenseSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict({ message: "Extraneous path parameters rejected" }),
  body: z
    .object({})
    .strict({
      message: "Request body is not accepted on expense approval endpoint",
    })
    .optional(),
});

// =====================  COMPATIBILITY OBJECT  ==============
export const expenseValidation = {
  create: createExpenseSchema.shape.body,
  listQuery: listExpensesQuerySchema.shape.query,
  approveParams: approveExpenseSchema.shape.params,
};
