// =====================  IMPORTS  ==========================
import { z } from "zod";
import { STAFF_CONSTANTS } from "./staff.constants.js";

// =====================  REGEX PATTERNS  ====================
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string({
    required_error: "ID is required",
    invalid_type_error: "ID must be a string",
  })
  .trim()
  .regex(
    OBJECT_ID_REGEX,
    "Invalid ObjectId format: must be 24-character hexadecimal string"
  );

// =====================  SCHEMAS  ===========================
/**
 * Validation schema for onboarding a new Staff profile (POST /api/v1/staff).
 *
 * Security & Integrity Invariants:
 * - Strict object: Mass-assignment attempts (averageRating, totalRatingsCount, status, isDeleted) are rejected.
 * - Category ↔ SubCategory compatibility: Cross-category mismatches are rejected.
 * - ADMINISTRATION category: Must not specify trade subcategories.
 */
export const createStaffSchema = z.object({
  body: z
    .object({
      userId: objectIdSchema,
      buildingId: objectIdSchema,
      category: z.enum(Object.values(STAFF_CONSTANTS.CATEGORIES), {
        errorMap: () => ({
          message: `Category must be one of: ${Object.values(STAFF_CONSTANTS.CATEGORIES).join(", ")}`,
        }),
      }),
      subCategory: z
        .enum(Object.values(STAFF_CONSTANTS.SUB_CATEGORIES), {
          errorMap: () => ({
            message: `Sub-category must be one of: ${Object.values(STAFF_CONSTANTS.SUB_CATEGORIES).join(", ")}`,
          }),
        })
        .optional()
        .nullable(),
      designation: z
        .string()
        .trim()
        .min(
          STAFF_CONSTANTS.DESIGNATION.MIN_LENGTH,
          `Designation must be at least ${STAFF_CONSTANTS.DESIGNATION.MIN_LENGTH} characters`
        )
        .max(
          STAFF_CONSTANTS.DESIGNATION.MAX_LENGTH,
          `Designation must not exceed ${STAFF_CONSTANTS.DESIGNATION.MAX_LENGTH} characters`
        )
        .optional()
        .nullable(),
      assignedShift: z
        .enum(Object.values(STAFF_CONSTANTS.SHIFTS), {
          errorMap: () => ({
            message: `Assigned shift must be one of: ${Object.values(STAFF_CONSTANTS.SHIFTS).join(", ")}`,
          }),
        })
        .optional()
        .default(STAFF_CONSTANTS.SHIFTS.MORNING),
    })
    .strict()
    .superRefine((data, ctx) => {
      // If category is ADMINISTRATION, subCategory must not be provided
      if (data.category === STAFF_CONSTANTS.CATEGORIES.ADMINISTRATION) {
        if (data.subCategory) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "ADMINISTRATION category does not accept trade subcategories. Use designation instead.",
            path: ["subCategory"],
          });
        }
      } else if (data.subCategory) {
        const allowed =
          STAFF_CONSTANTS.CATEGORY_SUBCATEGORY_MAP[data.category] || [];
        if (!allowed.includes(data.subCategory)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Sub-category '${data.subCategory}' is not valid for category '${data.category}'. Allowed: ${allowed.join(", ")}`,
            path: ["subCategory"],
          });
        }
      }
    }),
});

/**
 * Validation schema for listing Staff personnel (GET /api/v1/staff).
 */
export const listStaffQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be at least 1")
        .default(STAFF_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          STAFF_CONSTANTS.PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${STAFF_CONSTANTS.PAGINATION.MAX_LIMIT}`
        )
        .default(STAFF_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
      buildingId: objectIdSchema.optional(),
      category: z.enum(Object.values(STAFF_CONSTANTS.CATEGORIES)).optional(),
      subCategory: z
        .enum(Object.values(STAFF_CONSTANTS.SUB_CATEGORIES))
        .optional(),
      assignedShift: z.enum(Object.values(STAFF_CONSTANTS.SHIFTS)).optional(),
      status: z.enum(Object.values(STAFF_CONSTANTS.STATUS)).optional(),
      availability: z.string().trim().optional(),
      search: z
        .string()
        .trim()
        .max(100, "Search query must not exceed 100 characters")
        .optional(),
    })
    .strict(),
});

/**
 * Validation schema for Staff URL parameter (:id).
 */
export const staffIdParamSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});
