// =====================  IMPORTS  ==========================
import { z } from "zod";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
  MAINTENANCE_REQUEST_LIMITS,
  MAINTENANCE_REQUEST_PAGINATION,
} from "./maintenance-requests.constants.js";
import { isCloudinaryUrl } from "../../utils/cloudinary.util.js";

// =====================  OBJECT ID VALIDATOR  ================
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
 * Validation schema for submitting a new maintenance request.
 * POST /api/v1/maintenance-requests
 */
export const createMaintenanceRequestSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      flatId: objectIdSchema,
      category: z.enum(Object.values(MAINTENANCE_REQUEST_CATEGORY), {
        errorMap: () => ({
          message: `Category must be one of: ${Object.values(MAINTENANCE_REQUEST_CATEGORY).join(", ")}`,
        }),
      }),
      priority: z
        .enum(Object.values(MAINTENANCE_REQUEST_PRIORITY), {
          errorMap: () => ({
            message: `Priority must be one of: ${Object.values(MAINTENANCE_REQUEST_PRIORITY).join(", ")}`,
          }),
        })
        .default(MAINTENANCE_REQUEST_PRIORITY.MEDIUM),
      title: z
        .string({
          required_error: "Title is required",
          invalid_type_error: "Title must be a string",
        })
        .trim()
        .min(
          MAINTENANCE_REQUEST_LIMITS.TITLE_MIN_LENGTH,
          `Title must be at least ${MAINTENANCE_REQUEST_LIMITS.TITLE_MIN_LENGTH} characters`
        )
        .max(
          MAINTENANCE_REQUEST_LIMITS.TITLE_MAX_LENGTH,
          `Title cannot exceed ${MAINTENANCE_REQUEST_LIMITS.TITLE_MAX_LENGTH} characters`
        ),
      description: z
        .string({
          required_error: "Description is required",
          invalid_type_error: "Description must be a string",
        })
        .trim()
        .min(
          MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MIN_LENGTH,
          `Description must be at least ${MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MIN_LENGTH} characters`
        )
        .max(
          MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MAX_LENGTH,
          `Description cannot exceed ${MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MAX_LENGTH} characters`
        ),
      initialPhotos: z
        .array(
          z.string().trim().refine(isCloudinaryUrl, {
            message:
              "Initial photo URL must be an authentic Cloudinary CDN URL",
          })
        )
        .max(
          MAINTENANCE_REQUEST_LIMITS.MAX_INITIAL_PHOTOS,
          `Cannot exceed ${MAINTENANCE_REQUEST_LIMITS.MAX_INITIAL_PHOTOS} initial photos`
        )
        .default([]),
    })
    .strict(
      "Unrecognized fields are not permitted in maintenance request payload"
    ),
});

/**
 * Validation schema for assigning a technician to a request.
 * PATCH /api/v1/maintenance-requests/:id/assign
 */
export const assignMaintenanceRequestSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({
      assignedStaffId: objectIdSchema,
      priority: z.enum(Object.values(MAINTENANCE_REQUEST_PRIORITY)).optional(),
      category: z.enum(Object.values(MAINTENANCE_REQUEST_CATEGORY)).optional(),
    })
    .strict(),
});

/**
 * Validation schema for technician task status updates.
 * PATCH /api/v1/maintenance-requests/:id/status
 */
export const updateStatusSchema = z
  .object({
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),
    body: z
      .object({
        status: z.enum([
          MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
          MAINTENANCE_REQUEST_STATUS.COMPLETED,
        ]),
        completionPhotos: z
          .array(
            z.string().trim().refine(isCloudinaryUrl, {
              message:
                "Completion photo URL must be an authentic Cloudinary CDN URL",
            })
          )
          .max(
            MAINTENANCE_REQUEST_LIMITS.MAX_COMPLETION_PHOTOS,
            `Cannot exceed ${MAINTENANCE_REQUEST_LIMITS.MAX_COMPLETION_PHOTOS} completion photos`
          )
          .optional(),
      })
      .strict(),
  })
  .superRefine((data, ctx) => {
    if (data.body.status === MAINTENANCE_REQUEST_STATUS.COMPLETED) {
      if (
        !data.body.completionPhotos ||
        data.body.completionPhotos.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Completion photos are mandatory when marking work order COMPLETED",
          path: ["body", "completionPhotos"],
        });
      }
    }
  });

/**
 * Validation schema for resident repair quality verification.
 * PATCH /api/v1/maintenance-requests/:id/verify
 */
export const verifyMaintenanceRequestSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({
      approved: z.boolean({
        required_error: "approved boolean is required",
        invalid_type_error: "approved must be a boolean",
      }),
      feedback: z
        .string()
        .trim()
        .max(1000, "Feedback cannot exceed 1000 characters")
        .optional(),
    })
    .strict(),
});

/**
 * Validation schema for querying and filtering maintenance requests.
 * GET /api/v1/maintenance-requests
 */
export const listMaintenanceRequestsQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema.optional(),
      flatId: objectIdSchema.optional(),
      status: z.enum(Object.values(MAINTENANCE_REQUEST_STATUS)).optional(),
      category: z.enum(Object.values(MAINTENANCE_REQUEST_CATEGORY)).optional(),
      priority: z.enum(Object.values(MAINTENANCE_REQUEST_PRIORITY)).optional(),
      assignedStaffId: objectIdSchema.optional(),
      page: z.coerce
        .number({
          invalid_type_error: "Page must be a valid number",
        })
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .default(MAINTENANCE_REQUEST_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number({
          invalid_type_error: "Limit must be a valid number",
        })
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(
          MAINTENANCE_REQUEST_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${MAINTENANCE_REQUEST_PAGINATION.MAX_LIMIT}`
        )
        .default(MAINTENANCE_REQUEST_PAGINATION.DEFAULT_LIMIT),
    })
    .strict(),
});
