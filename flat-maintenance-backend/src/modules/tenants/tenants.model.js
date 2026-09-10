// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { TENANTS_CONSTANTS } from "./tenants.constants.js";

// =====================  SUBDOCUMENT SCHEMAS  ==============
/**
 * Emergency contact information subdocument schema.
 */
const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Emergency contact name is required"],
      trim: true,
      minlength: [
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.NAME_MIN_LENGTH,
        "Name must be at least 2 characters",
      ],
      maxlength: [
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.NAME_MAX_LENGTH,
        "Name must not exceed 64 characters",
      ],
    },
    relationship: {
      type: String,
      required: [true, "Emergency contact relationship is required"],
      trim: true,
      minlength: [
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MIN_LENGTH,
        "Relationship must be at least 2 characters",
      ],
      maxlength: [
        TENANTS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MAX_LENGTH,
        "Relationship must not exceed 32 characters",
      ],
    },
    phone: {
      type: String,
      required: [true, "Emergency contact phone is required"],
      trim: true,
    },
  },
  { _id: false }
);

// =====================  TENANT SCHEMA DEFINITION  ==========
/**
 * Tenant Residency and Lease Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 40 (Module 10: Tenants).
 * Governs tenant residency lifecycles, active lease contracts, security deposits,
 * monthly rent values, move-in/move-out workflows, and police verification document status.
 *
 * Core architectural invariants:
 * - 4-Way Relationship Graph: User -> Tenant -> Building -> Flat <- Owner.
 * - Single Active Tenancy: Each flat can possess at most one active tenant at any time.
 * - Unique Active Profile: 1:1 active tenant profile per User identity.
 * - Move-Out Transition: Releases the physical Flat unit back to VACANT status upon checkout.
 */
const tenantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building ID is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat ID is required"],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: [true, "Owner ID is required"],
      index: true,
    },
    leaseStartDate: {
      type: Date,
      required: [true, "Lease start date is required"],
    },
    leaseEndDate: {
      type: Date,
      required: [true, "Lease end date is required"],
    },
    rentAmount: {
      type: Number,
      required: [true, "Rent amount is required"],
      min: [0, "Rent amount cannot be negative"],
      default: 0,
    },
    securityDeposit: {
      type: Number,
      min: [0, "Security deposit cannot be negative"],
      default: 0,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: null,
    },
    policeVerificationStatus: {
      type: String,
      enum: {
        values: Object.values(TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS),
        message: "Invalid police verification status specified",
      },
      default: TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.PENDING,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TENANTS_CONSTANTS.TENANT_STATUS),
        message: "Invalid tenant status specified",
      },
      default: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      index: true,
    },
    moveOutDate: {
      type: Date,
      default: null,
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
    collection: "tenants",
  }
);

// =====================  INDEXES  ===========================
// Multi-tenant querying indexes
tenantSchema.index({ buildingId: 1, isDeleted: 1 });
tenantSchema.index({ flatId: 1, isDeleted: 1 });
tenantSchema.index({ leaseEndDate: 1 });

// Concurrency Invariant: At most one ACTIVE tenant per flat
tenantSchema.index(
  { flatId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      isDeleted: false,
    },
  }
);

// =====================  SERIALIZER  ========================
/**
 * Generates sanitized API representation of Tenant document.
 * Excludes internal Mongoose fields and soft-delete metadata.
 *
 * @returns {Object} Clean tenant representation.
 */
tenantSchema.methods.toSafeTenant = function () {
  const tenantObj = this.toObject();
  delete tenantObj.__v;
  delete tenantObj.isDeleted;
  delete tenantObj.deletedAt;
  return tenantObj;
};

// =====================  EXPORTS  ===========================
export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);
export default Tenant;
