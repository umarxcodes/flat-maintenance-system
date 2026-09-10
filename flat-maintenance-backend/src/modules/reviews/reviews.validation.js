// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  MODERATION_STATUS,
  REVIEW_LIMITS,
  REVIEW_PAGINATION,
} from "./reviews.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Validation schema for POST /api/v1/reviews
 */
export const createReviewSchema = z.object({
  body: z
    .object({
      maintenanceRequestId: objectIdSchema,
      rating: z
        .number({ required_error: "Rating is required" })
        .int({ message: "Rating must be an integer" })
        .min(
          REVIEW_LIMITS.RATING_MIN,
          `Rating must be at least ${REVIEW_LIMITS.RATING_MIN}`
        )
        .max(
          REVIEW_LIMITS.RATING_MAX,
          `Rating cannot exceed ${REVIEW_LIMITS.RATING_MAX}`
        ),
      title: z
        .string()
        .trim()
        .max(
          REVIEW_LIMITS.TITLE_MAX_LENGTH,
          `Title cannot exceed ${REVIEW_LIMITS.TITLE_MAX_LENGTH} characters`
        )
        .optional(),
      comment: z
        .string()
        .trim()
        .max(
          REVIEW_LIMITS.COMMENT_MAX_LENGTH,
          `Comment cannot exceed ${REVIEW_LIMITS.COMMENT_MAX_LENGTH} characters`
        )
        .optional(),
    })
    .strict({
      message:
        "Extraneous fields or mass-assignment payloads are strictly rejected",
    }),
});

/**
 * Validation schema for GET /api/v1/reviews
 */
export const listReviewsQuerySchema = z.object({
  query: z
    .object({
      staffId: objectIdSchema.optional(),
      buildingId: objectIdSchema.optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, "Page must be an integer greater than or equal to 1")
        .default(REVIEW_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(
          REVIEW_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${REVIEW_PAGINATION.MAX_LIMIT}`
        )
        .default(REVIEW_PAGINATION.DEFAULT_LIMIT),
      moderationStatus: z
        .enum(Object.values(MODERATION_STATUS), {
          message: `Invalid moderationStatus. Allowed values: ${Object.values(MODERATION_STATUS).join(", ")}`,
        })
        .optional(),
    })
    .strict({ message: "Extraneous query parameters rejected" }),
});

/**
 * Validation schema for PATCH /api/v1/reviews/:id/moderate
 */
export const moderateReviewSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({
      moderationStatus: z.enum(Object.values(MODERATION_STATUS), {
        message: `Invalid moderationStatus specified. Allowed values: ${Object.values(MODERATION_STATUS).join(", ")}`,
      }),
      moderationReason: z
        .string()
        .trim()
        .max(
          REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH,
          `Moderation reason cannot exceed ${REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH} characters`
        )
        .optional(),
      moderationNotes: z
        .string()
        .trim()
        .max(
          REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH,
          `Moderation notes cannot exceed ${REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH} characters`
        )
        .optional(),
    })
    .strict({ message: "Extraneous fields or mass-assignment rejected" })
    .refine(
      (data) => {
        if (
          [MODERATION_STATUS.FLAGGED, MODERATION_STATUS.HIDDEN].includes(
            data.moderationStatus
          )
        ) {
          return (
            typeof data.moderationReason === "string" &&
            data.moderationReason.trim().length > 0
          );
        }
        return true;
      },
      {
        message:
          "moderationReason is required when setting moderationStatus to FLAGGED or HIDDEN",
        path: ["moderationReason"],
      }
    ),
});

export const reviewValidation = {
  createReview: createReviewSchema.shape.body,
  listReviewsQuery: listReviewsQuerySchema.shape.query,
  moderateReview: moderateReviewSchema.shape.body,
};
