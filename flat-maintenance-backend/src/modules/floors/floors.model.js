// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { FLOORS_CONSTANTS } from "./floors.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Floor Mongoose Schema.
 * Represents physical vertical levels within a specific block or tower.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 37.
 */
const floorSchema = new mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Parent building ID is required"],
      index: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      required: [true, "Parent block ID is required"],
      index: true,
    },
    floorNumber: {
      type: Number,
      required: [true, "Floor number is required"],
      validate: {
        validator: Number.isInteger,
        message: "Floor number must be an integer",
      },
    },
    name: {
      type: String,
      trim: true,
      minlength: [
        FLOORS_CONSTANTS.NAME_MIN_LENGTH,
        `Floor name must be at least ${FLOORS_CONSTANTS.NAME_MIN_LENGTH} character`,
      ],
      maxlength: [
        FLOORS_CONSTANTS.NAME_MAX_LENGTH,
        `Floor name cannot exceed ${FLOORS_CONSTANTS.NAME_MAX_LENGTH} characters`,
      ],
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
    collection: "floors",
  }
);

// =====================  INDEXES  ===========================
/**
 * Compound unique constraint:
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 37 & 63.
 * Enforces that two floors within the same block cannot share the same floor number.
 */
floorSchema.index({ blockId: 1, floorNumber: 1 }, { unique: true });

/**
 * Compound index for high-performance active floor filtering by parent block.
 */
floorSchema.index({ blockId: 1, isDeleted: 1 });

/**
 * Compound index for building-level scope operations.
 */
floorSchema.index({ buildingId: 1, isDeleted: 1 });

// =====================  HOOKS  ==============================
floorSchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim();
  } else {
    // Sensible auto-generation if name is omitted
    if (this.floorNumber === 0) {
      this.name = "Ground Floor";
    } else if (this.floorNumber < 0) {
      this.name = `Basement ${Math.abs(this.floorNumber)}`;
    } else {
      this.name = `Floor ${this.floorNumber}`;
    }
  }
});

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms floor document to safe public API representation.
 * Excludes internal metadata (__v, isDeleted, deletedAt).
 *
 * @returns {Object} Public safe floor representation.
 */
floorSchema.methods.toSafeFloor = function () {
  return {
    id: this._id.toString(),
    buildingId: this.buildingId.toString(),
    blockId: this.blockId.toString(),
    floorNumber: this.floorNumber,
    name: this.name,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  EXPORTS  ============================
export const Floor = mongoose.model("Floor", floorSchema);
export default Floor;
