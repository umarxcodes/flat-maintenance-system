// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { BUILDING_STATUS } from "../modules/buildings/buildings.constants.js";

// =====================  SUBDOCUMENT SCHEMAS  ==============
/**
 * Physical address subdocument schema.
 * Embedded strictly as a bounded value object.
 */
const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      maxlength: [200, "Street address cannot exceed 200 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State/Province is required"],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters"],
    },
  },
  { _id: false }
);

// =====================  SCHEMA DEFINITION  ================
/**
 * Residential Complex / Building Schema.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35 & 56.
 *
 * Core Responsibilities:
 * - Represents top-level complex / tower / society anchor.
 * - Primary tenancy and OBAC scope boundary for all subordinate residential resources.
 * - Enforces database-level uniqueness on building code.
 * - Maintains MongoDB text index on name for community searches.
 */
const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Building name is required"],
      trim: true,
      minlength: [2, "Building name must be at least 2 characters"],
      maxlength: [128, "Building name cannot exceed 128 characters"],
    },
    code: {
      type: String,
      required: [true, "Building code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "Building code must be at least 2 characters"],
      maxlength: [50, "Building code cannot exceed 50 characters"],
    },
    address: {
      type: addressSchema,
      required: [true, "Building address is required"],
    },
    totalBlocks: {
      type: Number,
      default: 0,
      min: [0, "Total blocks cannot be negative"],
    },
    totalFlats: {
      type: Number,
      default: 0,
      min: [0, "Total flats cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BUILDING_STATUS),
        message: "Building status '{VALUE}' is not a valid status",
      },
      default: BUILDING_STATUS.ACTIVE,
      required: true,
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
    collection: "buildings",
  }
);

// =====================  INDEXES  ===========================
// Text index on name for search queries
buildingSchema.index({ name: "text" });

// Scope query optimization indexes
buildingSchema.index({ _id: 1, isDeleted: 1 });
buildingSchema.index({ status: 1, isDeleted: 1 });

// =====================  LIFECYCLE HOOKS  ==================
/**
 * Pre-save hook normalizes uppercase code and trims name.
 */
buildingSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
  if (this.name) {
    this.name = this.name.trim();
  }
});

// =====================  INSTANCE METHODS  ==================
/**
 * Safe serialization of Building document.
 * Excludes internal metadata (__v, isDeleted, deletedAt).
 *
 * @returns {Object} Sanitized public Building object.
 */
buildingSchema.methods.toSafeBuilding = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    code: this.code,
    address: this.address
      ? {
          street: this.address.street,
          city: this.address.city,
          state: this.address.state,
          postalCode: this.address.postalCode,
          country: this.address.country,
        }
      : undefined,
    totalBlocks: this.totalBlocks,
    totalFlats: this.totalFlats,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  MODEL & EXPORTS  ===================
export const Building =
  mongoose.models.Building || mongoose.model("Building", buildingSchema);
export default Building;
