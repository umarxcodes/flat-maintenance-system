// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { STAFF_CONSTANTS } from "./staff.constants.js";

// =====================  STAFF SCHEMA DEFINITION  ===========
/**
 * Staff Operational Personnel Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 41 (Module 11: Staff).
 * Governs on-site operational personnel, including Maintenance Technicians, Gate Security
 * Guards, Cleaning Personnel, and Operational Administrators.
 *
 * Architectural Invariants:
 * - 1:1 Active Staff Profile: Each user can possess at most one staff profile (unique userId).
 * - Building-Scoped Resource: Each staff record is attached to a physical building complex.
 * - Server-Controlled Ratings: averageRating and totalRatingsCount are aggregate metrics
 *   governed by the system rating engine (Module 17), not client input.
 * - Soft-Delete Support: Supports non-destructive soft-deletion via isDeleted and deletedAt.
 */
const staffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building ID is required"],
    },
    category: {
      type: String,
      enum: {
        values: Object.values(STAFF_CONSTANTS.CATEGORIES),
        message: "Invalid staff category specified",
      },
      required: [true, "Staff category is required"],
    },
    subCategory: {
      type: String,
      enum: {
        values: Object.values(STAFF_CONSTANTS.SUB_CATEGORIES),
        message: "Invalid staff sub-category specified",
      },
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [
        STAFF_CONSTANTS.DESIGNATION.MAX_LENGTH,
        "Designation must not exceed 64 characters",
      ],
      default: null,
    },
    assignedShift: {
      type: String,
      enum: {
        values: Object.values(STAFF_CONSTANTS.SHIFTS),
        message: "Invalid assigned shift specified",
      },
      default: STAFF_CONSTANTS.SHIFTS.MORNING,
    },
    averageRating: {
      type: Number,
      min: [
        STAFF_CONSTANTS.RATINGS.MIN,
        "Average rating cannot be less than 0.0",
      ],
      max: [STAFF_CONSTANTS.RATINGS.MAX, "Average rating cannot exceed 5.0"],
      default: STAFF_CONSTANTS.RATINGS.DEFAULT_AVERAGE,
    },
    totalRatingsCount: {
      type: Number,
      min: [0, "Total ratings count cannot be negative"],
      default: STAFF_CONSTANTS.RATINGS.DEFAULT_COUNT,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(STAFF_CONSTANTS.STATUS),
        message: "Invalid staff status specified",
      },
      default: STAFF_CONSTANTS.STATUS.ACTIVE,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "staff",
  }
);

// =====================  INDEXES  ===========================
// Multi-tenant querying and filtering indexes
staffSchema.index({ buildingId: 1, isDeleted: 1 });
staffSchema.index({ buildingId: 1, category: 1, isDeleted: 1 });
staffSchema.index({ buildingId: 1, status: 1, isDeleted: 1 });
staffSchema.index({ buildingId: 1, assignedShift: 1, isDeleted: 1 });

// =====================  SERIALIZER  ========================
/**
 * Generates sanitized API representation of Staff document.
 * Excludes internal Mongoose fields and soft-delete metadata.
 *
 * @returns {Object} Clean staff representation.
 */
staffSchema.methods.toSafeStaff = function () {
  const staffObj = this.toObject();
  delete staffObj.__v;
  delete staffObj.isDeleted;
  delete staffObj.deletedAt;
  return staffObj;
};

// =====================  EXPORTS  ===========================
export const Staff =
  mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export default Staff;
