// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { OWNERS_CONSTANTS } from "./owners.constants.js";

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
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.NAME_MIN_LENGTH,
        "Name must be at least 2 characters",
      ],
      maxlength: [
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.NAME_MAX_LENGTH,
        "Name must not exceed 64 characters",
      ],
    },
    relationship: {
      type: String,
      required: [true, "Emergency contact relationship is required"],
      trim: true,
      minlength: [
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MIN_LENGTH,
        "Relationship must be at least 2 characters",
      ],
      maxlength: [
        OWNERS_CONSTANTS.EMERGENCY_CONTACT.RELATIONSHIP_MAX_LENGTH,
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

// =====================  OWNER SCHEMA DEFINITION  ===========
/**
 * Property Owner Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 39 (Module 9: Owners).
 * Represents property ownership profiles, emergency contacts, government ID documentation,
 * and multi-flat ownership portfolios.
 *
 * Architectural Invariants:
 * - Decoupled Profile: Specializes User model (`userId` -> `users`), maintaining 1:1 active ownership profile.
 * - Multi-Flat Portfolio: `flatsOwned` is an array of Flat references belonging to `buildingId`.
 * - Cross-Building Guard: Every flat in `flatsOwned` must belong strictly to the owner's `buildingId`.
 * - Soft-Delete Support: Supports soft-deletion via `isDeleted` and `deletedAt`.
 */
const ownerSchema = new mongoose.Schema(
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
    flatsOwned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Flat",
        index: true,
      },
    ],
    emergencyContact: {
      type: emergencyContactSchema,
      default: null,
    },
    idProofType: {
      type: String,
      enum: {
        values: Object.values(OWNERS_CONSTANTS.ID_PROOF_TYPES),
        message: "Invalid ID proof type specified",
      },
      default: null,
    },
    idProofUrl: {
      type: String,
      default: null,
      trim: true,
    },
    isResidingInBuilding: {
      type: Boolean,
      default: false,
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
    collection: "owners",
  }
);

// Multi-tenant querying index
ownerSchema.index({ buildingId: 1, isDeleted: 1 });

// =====================  SERIALIZER  ========================
/**
 * Generates sanitized API representation of Owner document.
 * Excludes internal Mongoose fields and soft-delete metadata.
 *
 * @returns {Object} Clean owner representation.
 */
ownerSchema.methods.toSafeOwner = function () {
  const ownerObj = this.toObject();
  delete ownerObj.__v;
  delete ownerObj.isDeleted;
  delete ownerObj.deletedAt;
  return ownerObj;
};

// =====================  EXPORTS  ===========================
export const Owner =
  mongoose.models.Owner || mongoose.model("Owner", ownerSchema);
export default Owner;
