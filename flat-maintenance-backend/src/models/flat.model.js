// =====================  IMPORTS  ==========================
import mongoose from "mongoose";

// =====================  ENUM CONSTANTS  ====================
export const FLAT_TYPES = Object.freeze({
  ONE_BHK: "1BHK",
  TWO_BHK: "2BHK",
  THREE_BHK: "3BHK",
  FOUR_BHK: "4BHK",
  PENTHOUSE: "PENTHOUSE",
  STUDIO: "STUDIO",
});

export const FLAT_STATUS = Object.freeze({
  VACANT: "VACANT",
  OCCUPIED: "OCCUPIED",
  UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
  INACTIVE: "INACTIVE",
});

// =====================  FLAT SCHEMA DEFINITION  ===========
/**
 * Flat Unit Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 38 (Module 8: Flats).
 * Represents individual physical apartment/flat units within a residential building, block, and floor.
 *
 * Core architectural invariants:
 * - 4-Tier Hierarchy: Building -> Block -> Floor -> Flat.
 * - Compound Uniqueness: { blockId: 1, flatNumber: 1 } prevents duplicate flat numbers in the same block.
 * - Ownership & Occupancy: References active Owner (currentOwnerId) and active Tenant (currentTenantId).
 * - Maintenance Billing Dimension: areaSqFt must be a strictly positive number.
 */
const flatSchema = new mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building ID is required"],
      index: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      required: [true, "Block ID is required"],
      index: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: [true, "Floor ID is required"],
      index: true,
    },
    flatNumber: {
      type: String,
      required: [true, "Flat number is required"],
      trim: true,
      maxlength: 32,
    },
    areaSqFt: {
      type: Number,
      required: [true, "Area in square feet is required"],
      min: [1, "Area must be greater than zero"],
    },
    flatType: {
      type: String,
      enum: Object.values(FLAT_TYPES),
      default: FLAT_TYPES.TWO_BHK,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FLAT_STATUS),
      default: FLAT_STATUS.VACANT,
      required: true,
      index: true,
    },
    currentOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
      index: true,
    },
    currentTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
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
  },
  {
    timestamps: true,
    collection: "flats",
  }
);

// =====================  INDEXES  ===========================
// Compound uniqueness per block: flat numbers are unique within a block
flatSchema.index({ blockId: 1, flatNumber: 1 }, { unique: true });

// Multi-tenant querying index
flatSchema.index({ buildingId: 1, isDeleted: 1 });

// =====================  SERIALIZER  ========================
/**
 * Generates safe API representation of Flat unit.
 * Excludes internal Mongoose metadata.
 *
 * @returns {Object} Clean flat representation.
 */
flatSchema.methods.toSafeFlat = function () {
  const flatObj = this.toObject();
  delete flatObj.__v;
  delete flatObj.isDeleted;
  delete flatObj.deletedAt;
  return flatObj;
};

// =====================  EXPORTS  ===========================
export const Flat = mongoose.models.Flat || mongoose.model("Flat", flatSchema);
export default Flat;
