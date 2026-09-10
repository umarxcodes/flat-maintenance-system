// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import {
  COMPLAINT_TYPE,
  COMPLAINT_STATUS,
  COMPLAINT_LIMITS,
} from "./complaints.constants.js";

// =====================  SCHEMA DEFINITION  =================
const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      required: [true, "complaintNumber is strictly required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "buildingId is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "flatId is required"],
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdById is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(COMPLAINT_TYPE),
        message: "Invalid complaint type: '{VALUE}'",
      },
      required: [true, "type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      minlength: [
        COMPLAINT_LIMITS.TITLE_MIN_LENGTH,
        `Title must be at least ${COMPLAINT_LIMITS.TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        COMPLAINT_LIMITS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${COMPLAINT_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
      minlength: [
        COMPLAINT_LIMITS.DESCRIPTION_MIN_LENGTH,
        `Description must be at least ${COMPLAINT_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
      ],
      maxlength: [
        COMPLAINT_LIMITS.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${COMPLAINT_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(COMPLAINT_STATUS),
        message: "Invalid complaint status: '{VALUE}'",
      },
      default: COMPLAINT_STATUS.OPEN,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: null,
      maxlength: [
        COMPLAINT_LIMITS.RESOLUTION_NOTES_MAX_LENGTH,
        `Resolution notes cannot exceed ${COMPLAINT_LIMITS.RESOLUTION_NOTES_MAX_LENGTH} characters`,
      ],
    },
    resolvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "complaints",
  }
);

// =====================  COMPOUND QUERY INDEXES  ============
// Optimized for building-scoped and flat-scoped status/type listings
complaintSchema.index({ buildingId: 1, status: 1 });
complaintSchema.index({ flatId: 1, status: 1 });
complaintSchema.index({ buildingId: 1, type: 1 });

// =====================  INSTANCE SERIALIZER  ===============
/**
 * Serializes Complaint document to safe client presentation DTO.
 * Guarantees zero leakage of sensitive password hashes, auth tokens, or internal metadata.
 */
complaintSchema.methods.toSafeComplaint = function () {
  const sanitizeUser = (userRef) => {
    if (!userRef || typeof userRef !== "object" || !userRef._id) {
      return userRef || null;
    }
    return {
      _id: userRef._id,
      firstName: userRef.firstName || "",
      lastName: userRef.lastName || "",
      email: userRef.email || "",
      role: userRef.role || "",
    };
  };

  return {
    _id: this._id,
    complaintNumber: this.complaintNumber,
    buildingId: this.buildingId,
    flatId: this.flatId,
    createdById: sanitizeUser(this.createdById),
    type: this.type,
    title: this.title,
    description: this.description,
    status: this.status,
    resolutionNotes: this.resolutionNotes || null,
    resolvedById: sanitizeUser(this.resolvedById),
    resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : null,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

export const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
