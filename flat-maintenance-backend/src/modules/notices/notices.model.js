// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import {
  NOTICE_CATEGORY,
  NOTICE_PRIORITY,
  TARGET_AUDIENCE,
  NOTICE_LIMITS,
} from "./notices.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Authoritative Mongoose Schema for Society Notices & Announcements.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 48 & Section 25.
 * Governs official communications, emergency alerts, maintenance schedules,
 * and meeting notices broadcast to targeted resident segments.
 */
const noticeSchema = new Schema(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building reference is required"],
      index: true,
    },
    blockId: {
      type: Schema.Types.ObjectId,
      ref: "Block",
      default: null,
      index: true,
    },
    authorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author user reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      minlength: [
        NOTICE_LIMITS.TITLE_MIN_LENGTH,
        `Title must be at least ${NOTICE_LIMITS.TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        NOTICE_LIMITS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${NOTICE_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    content: {
      type: String,
      required: [true, "Notice content is required"],
      trim: true,
      minlength: [
        NOTICE_LIMITS.CONTENT_MIN_LENGTH,
        `Content must be at least ${NOTICE_LIMITS.CONTENT_MIN_LENGTH} characters`,
      ],
      maxlength: [
        NOTICE_LIMITS.CONTENT_MAX_LENGTH,
        `Content cannot exceed ${NOTICE_LIMITS.CONTENT_MAX_LENGTH} characters`,
      ],
    },
    category: {
      type: String,
      enum: {
        values: Object.values(NOTICE_CATEGORY),
        message: "Invalid notice category specified",
      },
      required: [true, "Notice category is required"],
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(NOTICE_PRIORITY),
        message: "Invalid notice priority specified",
      },
      default: NOTICE_PRIORITY.NORMAL,
      required: true,
    },
    targetAudience: {
      type: String,
      enum: {
        values: Object.values(TARGET_AUDIENCE),
        message: "Invalid target audience specified",
      },
      default: TARGET_AUDIENCE.ALL,
      required: true,
      index: true,
    },
    attachmentUrls: {
      type: [String],
      default: [],
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    retractedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notices",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Timeline index: fast retrieval of building notices by publication date
noticeSchema.index({ buildingId: 1, isDeleted: 1, publishedAt: -1 });

// Targeted active bulletin feed query index
noticeSchema.index({
  buildingId: 1,
  blockId: 1,
  targetAudience: 1,
  isDeleted: 1,
  expiresAt: 1,
});

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms Notice document into a safe, normalized presentation DTO.
 *
 * @returns {Object} Clean notice object.
 */
noticeSchema.methods.toSafeNotice = function () {
  return {
    _id: this._id.toString(),
    id: this._id.toString(),
    buildingId: this.buildingId._id
      ? this.buildingId._id.toString()
      : this.buildingId.toString(),
    blockId: this.blockId
      ? this.blockId._id
        ? this.blockId._id.toString()
        : this.blockId.toString()
      : null,
    authorUserId: this.authorUserId._id
      ? this.authorUserId._id.toString()
      : this.authorUserId.toString(),
    title: this.title,
    content: this.content,
    category: this.category,
    priority: this.priority,
    targetAudience: this.targetAudience,
    attachmentUrls: this.attachmentUrls || [],
    publishedAt: this.publishedAt,
    expiresAt: this.expiresAt,
    isDeleted: this.isDeleted,
    deletedAt: this.deletedAt,
    retractedById: this.retractedById
      ? this.retractedById._id
        ? this.retractedById._id.toString()
        : this.retractedById.toString()
      : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  EXPORTS  ===========================
export const Notice =
  mongoose.models.Notice || mongoose.model("Notice", noticeSchema);
export default Notice;
