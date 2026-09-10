// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import { MODERATION_STATUS, REVIEW_LIMITS } from "./reviews.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Authoritative Mongoose Schema for Reviews.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 47.
 * Captures resident quality feedback for completed maintenance work orders,
 * driving technician scorecards and building quality metrics.
 */
const reviewSchema = new Schema(
  {
    maintenanceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
      required: [true, "Maintenance request reference is required"],
      unique: true,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building reference is required"],
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat reference is required"],
      index: true,
    },
    residentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Resident user reference is required"],
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: [true, "Staff member reference is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [
        REVIEW_LIMITS.RATING_MIN,
        `Rating must be at least ${REVIEW_LIMITS.RATING_MIN}`,
      ],
      max: [
        REVIEW_LIMITS.RATING_MAX,
        `Rating cannot exceed ${REVIEW_LIMITS.RATING_MAX}`,
      ],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [
        REVIEW_LIMITS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${REVIEW_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [
        REVIEW_LIMITS.COMMENT_MAX_LENGTH,
        `Comment cannot exceed ${REVIEW_LIMITS.COMMENT_MAX_LENGTH} characters`,
      ],
      default: null,
    },
    moderationStatus: {
      type: String,
      enum: {
        values: Object.values(MODERATION_STATUS),
        message: "Invalid moderation status specified",
      },
      default: MODERATION_STATUS.PUBLISHED,
      index: true,
    },
    moderatedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [
        REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH,
        `Moderation reason cannot exceed ${REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH} characters`,
      ],
      default: null,
    },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: [
        REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH,
        `Moderation notes cannot exceed ${REVIEW_LIMITS.MODERATION_REASON_MAX_LENGTH} characters`,
      ],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Compound index: fast retrieval of published reviews by technician
reviewSchema.index({ staffId: 1, moderationStatus: 1, createdAt: -1 });

// Compound index: fast retrieval of published reviews by building complex
reviewSchema.index({ buildingId: 1, moderationStatus: 1, createdAt: -1 });

// =====================  SERIALIZER  ========================
/**
 * Generates sanitized API representation of Review document.
 * Excludes internal Mongoose metadata.
 *
 * @returns {Object} Clean plain presentation object.
 */
reviewSchema.methods.toSafeReview = function () {
  return {
    _id: this._id.toString(),
    id: this._id.toString(),
    maintenanceRequestId: this.maintenanceRequestId._id
      ? this.maintenanceRequestId._id.toString()
      : this.maintenanceRequestId.toString(),
    buildingId: this.buildingId._id
      ? this.buildingId._id.toString()
      : this.buildingId.toString(),
    flatId: this.flatId._id
      ? this.flatId._id.toString()
      : this.flatId.toString(),
    residentUserId: this.residentUserId._id
      ? this.residentUserId._id.toString()
      : this.residentUserId.toString(),
    staffId: this.staffId._id
      ? this.staffId._id.toString()
      : this.staffId.toString(),
    rating: this.rating,
    title: this.title,
    comment: this.comment,
    moderationStatus: this.moderationStatus,
    moderatedById: this.moderatedById ? this.moderatedById.toString() : null,
    moderatedAt: this.moderatedAt,
    moderationReason: this.moderationReason,
    moderationNotes: this.moderationNotes || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  EXPORTS  ===========================
export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
