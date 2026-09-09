// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { BLOCKS_CONSTANTS } from "../modules/blocks/blocks.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Block Mongoose Schema.
 * Represents architectural divisions (towers, blocks, wings) strictly subordinate to a building complex.
 */
const blockSchema = new mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Parent building ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Block name is required"],
      trim: true,
      minlength: [
        BLOCKS_CONSTANTS.NAME_MIN_LENGTH,
        `Block name must be at least ${BLOCKS_CONSTANTS.NAME_MIN_LENGTH} character`,
      ],
      maxlength: [
        BLOCKS_CONSTANTS.NAME_MAX_LENGTH,
        `Block name cannot exceed ${BLOCKS_CONSTANTS.NAME_MAX_LENGTH} characters`,
      ],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [
        BLOCKS_CONSTANTS.CODE_MAX_LENGTH,
        `Block code cannot exceed ${BLOCKS_CONSTANTS.CODE_MAX_LENGTH} characters`,
      ],
      default: null,
    },
    totalFloors: {
      type: Number,
      required: [true, "Total floors count is required"],
      min: [
        BLOCKS_CONSTANTS.MIN_FLOORS,
        `Total floors cannot be less than ${BLOCKS_CONSTANTS.MIN_FLOORS}`,
      ],
      max: [
        BLOCKS_CONSTANTS.MAX_FLOORS,
        `Total floors cannot exceed ${BLOCKS_CONSTANTS.MAX_FLOORS}`,
      ],
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
    collection: "blocks",
  }
);

// =====================  INDEXES  ===========================
/**
 * Compound unique constraint:
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 36.
 * Enforces that two blocks within the same building cannot share the same name.
 */
blockSchema.index({ buildingId: 1, name: 1 }, { unique: true });

/**
 * Compound index for high-performance active block filtering by parent building.
 */
blockSchema.index({ buildingId: 1, isDeleted: 1 });

// =====================  HOOKS  ==============================
blockSchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
});

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms block document to safe public API representation.
 * Excludes internal metadata (__v, isDeleted, deletedAt).
 *
 * @returns {Object} Public safe block representation.
 */
blockSchema.methods.toSafeBlock = function () {
  return {
    id: this._id.toString(),
    buildingId: this.buildingId.toString(),
    name: this.name,
    code: this.code || null,
    totalFloors: this.totalFloors,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  EXPORTS  ============================
export const Block = mongoose.model("Block", blockSchema);
export default Block;
