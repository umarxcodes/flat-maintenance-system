// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
  MAINTENANCE_REQUEST_LIMITS,
} from "./maintenance-requests.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Authoritative Mongoose Schema for Maintenance Requests / Work Orders.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 43.
 * Governs physical repairs, manager dispatch, technician execution, and resident sign-off.
 */
const maintenanceRequestSchema = new Schema(
  {
    requestNumber: {
      type: String,
      required: [true, "Request number is required"],
      unique: true,
      index: true,
      trim: true,
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
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user reference is required"],
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(MAINTENANCE_REQUEST_CATEGORY),
        message: "Invalid maintenance category specified",
      },
      required: [true, "Maintenance category is required"],
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(MAINTENANCE_REQUEST_PRIORITY),
        message: "Invalid maintenance priority specified",
      },
      default: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [
        MAINTENANCE_REQUEST_LIMITS.TITLE_MIN_LENGTH,
        `Title must be at least ${MAINTENANCE_REQUEST_LIMITS.TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        MAINTENANCE_REQUEST_LIMITS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${MAINTENANCE_REQUEST_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [
        MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MIN_LENGTH,
        `Description must be at least ${MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
      ],
      maxlength: [
        MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${MAINTENANCE_REQUEST_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    initialPhotos: {
      type: [String],
      default: [],
    },
    completionPhotos: {
      type: [String],
      default: [],
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MAINTENANCE_REQUEST_STATUS),
        message: "Invalid maintenance status specified",
      },
      default: MAINTENANCE_REQUEST_STATUS.OPEN,
      index: true,
    },
    slaDeadline: {
      type: Date,
      required: [true, "SLA deadline is required"],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "maintenanceRequests",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Fast building status filtering for facility dashboards
maintenanceRequestSchema.index({ buildingId: 1, status: 1 });

// Fast flat history retrieval for resident portals
maintenanceRequestSchema.index({ flatId: 1, createdAt: -1 });

// Fast technician work queue queries
maintenanceRequestSchema.index({ assignedStaffId: 1, status: 1 });

// =====================  SERIALIZER  ========================
/**
 * Serializes maintenance request into a safe, predictable plain object.
 *
 * @returns {Object} Clean presentation DTO.
 */
maintenanceRequestSchema.methods.toSafeMaintenanceRequest = function () {
  return {
    _id: this._id.toString(),
    requestNumber: this.requestNumber,
    buildingId: this.buildingId._id
      ? this.buildingId._id.toString()
      : this.buildingId.toString(),
    flatId: this.flatId._id
      ? this.flatId._id.toString()
      : this.flatId.toString(),
    createdById: this.createdById._id
      ? this.createdById._id.toString()
      : this.createdById.toString(),
    category: this.category,
    priority: this.priority,
    title: this.title,
    description: this.description,
    initialPhotos: this.initialPhotos || [],
    completionPhotos: this.completionPhotos || [],
    assignedStaffId: this.assignedStaffId
      ? this.assignedStaffId._id
        ? this.assignedStaffId._id.toString()
        : this.assignedStaffId.toString()
      : null,
    status: this.status,
    slaDeadline: this.slaDeadline ? this.slaDeadline.toISOString() : undefined,
    startedAt: this.startedAt ? this.startedAt.toISOString() : null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    verifiedAt: this.verifiedAt ? this.verifiedAt.toISOString() : null,
    createdAt: this.createdAt ? this.createdAt.toISOString() : undefined,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
  };
};

// =====================  MODEL COMPILATION  =================
export const MaintenanceRequest = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema
);

export default MaintenanceRequest;
