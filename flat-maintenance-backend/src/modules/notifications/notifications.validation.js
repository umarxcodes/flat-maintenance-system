// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_PAGINATION,
} from "./notifications.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for GET /api/v1/notifications
 */
export const listNotificationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(NOTIFICATION_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          NOTIFICATION_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${NOTIFICATION_PAGINATION.MAX_LIMIT}`
        )
        .default(NOTIFICATION_PAGINATION.DEFAULT_LIMIT),
      isRead: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .transform((val) => (typeof val === "boolean" ? val : val === "true"))
        .optional(),
      category: z
        .enum(Object.values(NOTIFICATION_CATEGORY), {
          message: `Invalid category. Allowed values: ${Object.values(NOTIFICATION_CATEGORY).join(", ")}`,
        })
        .optional(),
    })
    .strict({ message: "Extraneous query parameters rejected" }),
});

/**
 * Validation schema for PATCH /api/v1/notifications/:id/read
 */
export const markNotificationReadSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict({ message: "Extraneous path parameters rejected" }),
  body: z
    .object({})
    .strict({
      message: "Request body is not accepted for mark read endpoint",
    })
    .optional(),
});

/**
 * Validation schema for PATCH /api/v1/notifications/read-all
 */
export const markAllNotificationsReadSchema = z.object({
  body: z
    .object({})
    .strict({
      message: "Request body is not accepted for read-all endpoint",
    })
    .optional(),
  query: z
    .object({})
    .strict({
      message: "Query parameters are not accepted for read-all endpoint",
    })
    .optional(),
});

// =====================  COMPATIBILITY OBJECT  ==============
export const notificationValidation = {
  listQuery: listNotificationsQuerySchema.shape.query,
  markReadParams: markNotificationReadSchema.shape.params,
};
