// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import {
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
  DOCUMENT_CONSTRAINTS,
} from "./documents.constants.js";

// =====================  SCHEMA DEFINITION  =================
const documentSchema = new mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building reference is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      minlength: [
        DOCUMENT_CONSTRAINTS.TITLE_MIN_LENGTH,
        `Document title must be at least ${DOCUMENT_CONSTRAINTS.TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        DOCUMENT_CONSTRAINTS.TITLE_MAX_LENGTH,
        `Document title cannot exceed ${DOCUMENT_CONSTRAINTS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    documentType: {
      type: String,
      enum: {
        values: Object.values(DOCUMENT_TYPES),
        message: "Invalid document classification type: {VALUE}",
      },
      required: [true, "Document classification type is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "Document file URL is required"],
      trim: true,
    },
    visibility: {
      type: String,
      enum: {
        values: Object.values(DOCUMENT_VISIBILITY),
        message: "Invalid document visibility level: {VALUE}",
      },
      required: [true, "Document visibility level is required"],
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user reference is required"],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
documentSchema.index({ buildingId: 1, visibility: 1, isDeleted: 1 });
documentSchema.index({ buildingId: 1, flatId: 1, isDeleted: 1 });
documentSchema.index({ buildingId: 1, isDeleted: 1, createdAt: -1 });

// =====================  INSTANCE METHODS  ==================
/**
 * Returns safe external representation of the document.
 *
 * @returns {Object}
 */
documentSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    buildingId: this.buildingId,
    flatId: this.flatId,
    title: this.title,
    documentType: this.documentType,
    fileUrl: this.fileUrl,
    visibility: this.visibility,
    uploadedById: this.uploadedById,
    isDeleted: this.isDeleted,
    deletedAt: this.deletedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  MODEL EXPORT  ======================
export const Document = mongoose.model("Document", documentSchema);
export default Document;
