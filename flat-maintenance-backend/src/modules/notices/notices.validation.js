// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  NOTICE_CATEGORY,
  NOTICE_PRIORITY,
  TARGET_AUDIENCE,
  NOTICE_LIMITS,
  NOTICE_PAGINATION,
} from "./notices.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/notices
 */
export const createNoticeSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      blockId: objectIdSchema.optional(),
      title: z
        .string({ required_error: "Notice title is required" })
        .trim()
        .min(
          NOTICE_LIMITS.TITLE_MIN_LENGTH,
          `Title must be at least ${NOTICE_LIMITS.TITLE_MIN_LENGTH} characters`
        )
        .max(
          NOTICE_LIMITS.TITLE_MAX_LENGTH,
          `Title cannot exceed ${NOTICE_LIMITS.TITLE_MAX_LENGTH} characters`
        ),
      content: z
        .string({ required_error: "Notice content is required" })
        .trim()
        .min(
          NOTICE_LIMITS.CONTENT_MIN_LENGTH,
          `Content must be at least ${NOTICE_LIMITS.CONTENT_MIN_LENGTH} characters`
        )
        .max(
          NOTICE_LIMITS.CONTENT_MAX_LENGTH,
          `Content cannot exceed ${NOTICE_LIMITS.CONTENT_MAX_LENGTH} characters`
        ),
      category: z.enum(Object.values(NOTICE_CATEGORY), {
        message: `Invalid category. Allowed values: ${Object.values(NOTICE_CATEGORY).join(", ")}`,
      }),
      priority: z
        .enum(Object.values(NOTICE_PRIORITY), {
          message: `Invalid priority. Allowed values: ${Object.values(NOTICE_PRIORITY).join(", ")}`,
        })
        .optional(),
      targetAudience: z
        .enum(Object.values(TARGET_AUDIENCE), {
          message: `Invalid targetAudience. Allowed values: ${Object.values(TARGET_AUDIENCE).join(", ")}`,
        })
        .optional(),
      attachmentUrls: z
        .array(
          z.string().url({ message: "Invalid URL provided in attachmentUrls" })
        )
        .max(
          NOTICE_LIMITS.MAX_ATTACHMENT_URLS,
          `Cannot attach more than ${NOTICE_LIMITS.MAX_ATTACHMENT_URLS} URLs`
        )
        .optional(),
      expiresAt: z.coerce
        .date({ message: "Invalid date format for expiresAt" })
        .refine((d) => d.getTime() > Date.now(), {
          message: "expiresAt must be a future timestamp",
        })
        .optional(),
    })
    .strict({
      message:
        "Extraneous fields or mass-assignment payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/notices
 */
export const listNoticesQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema.optional(),
      blockId: objectIdSchema.optional(),
      category: z
        .enum(Object.values(NOTICE_CATEGORY), {
          message: `Invalid category. Allowed values: ${Object.values(NOTICE_CATEGORY).join(", ")}`,
        })
        .optional(),
      priority: z
        .enum(Object.values(NOTICE_PRIORITY), {
          message: `Invalid priority. Allowed values: ${Object.values(NOTICE_PRIORITY).join(", ")}`,
        })
        .optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(NOTICE_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          NOTICE_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${NOTICE_PAGINATION.MAX_LIMIT}`
        )
        .default(NOTICE_PAGINATION.DEFAULT_LIMIT),
    })
    .strict({ message: "Extraneous query parameters rejected" }),
});

/**
 * Validation schema for DELETE /api/v1/notices/:id
 */
export const retractNoticeSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict({ message: "Extraneous path parameters rejected" }),
});

// =====================  COMPATIBILITY OBJECT  ==============
export const noticeValidation = {
  createNotice: createNoticeSchema.shape.body,
  listNoticesQuery: listNoticesQuerySchema.shape.query,
  retractNotice: retractNoticeSchema.shape.params,
};
