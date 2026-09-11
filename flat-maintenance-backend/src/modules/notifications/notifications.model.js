// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_LIMITS,
  NOTIFICATION_TTL_SECONDS,
} from "./notifications.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Mongoose schema for high-throughput personal in-app notifications.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 49.
 */
const notificationSchema = new Schema(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient user ID is required"],
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building ID is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [
        NOTIFICATION_LIMITS.TITLE_MAX_LENGTH,
        `Notification title cannot exceed ${NOTIFICATION_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    body: {
      type: String,
      required: [true, "Notification body is required"],
      trim: true,
      maxlength: [
        NOTIFICATION_LIMITS.BODY_MAX_LENGTH,
        `Notification body cannot exceed ${NOTIFICATION_LIMITS.BODY_MAX_LENGTH} characters`,
      ],
    },
    category: {
      type: String,
      required: [true, "Notification category is required"],
      enum: {
        values: Object.values(NOTIFICATION_CATEGORY),
        message: "Invalid notification category '{VALUE}'",
      },
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      trim: true,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// 90-day automatic MongoDB TTL cleanup on createdAt
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: NOTIFICATION_TTL_SECONDS }
);

// Primary personal notification timeline query index (newest first)
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

// Filtered feed index (supporting isRead queries & bulk read-all mutations)
notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms Notification document into a clean, safe DTO.
 *
 * @returns {Object} Standardized notification presentation object.
 */
notificationSchema.methods.toSafeNotification = function () {
  return {
    _id: this._id.toString(),
    id: this._id.toString(),
    recipientUserId: this.recipientUserId?._id
      ? this.recipientUserId._id.toString()
      : this.recipientUserId?.toString() || null,
    buildingId: this.buildingId?._id
      ? this.buildingId._id.toString()
      : this.buildingId?.toString() || null,
    title: this.title,
    body: this.body,
    category: this.category,
    referenceId: this.referenceId?._id
      ? this.referenceId._id.toString()
      : this.referenceId?.toString() || null,
    referenceModel: this.referenceModel || null,
    isRead: Boolean(this.isRead),
    readAt: this.readAt instanceof Date ? this.readAt.toISOString() : null,
    createdAt:
      this.createdAt instanceof Date ? this.createdAt.toISOString() : null,
    updatedAt:
      this.updatedAt instanceof Date ? this.updatedAt.toISOString() : null,
  };
};

// =====================  MODEL REGISTRATION  ================
export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
