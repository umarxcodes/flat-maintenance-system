import mongoose from "mongoose";
import { ROLES } from "../constants/roles.constant.js";

/**
 * Role-Based Access Control (RBAC) Role Definition Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 33.
 *
 * Core Responsibilities:
 * - Maps named operational personas to lists of deterministic permission strings.
 * - System roles are immutable in their identity and cannot be converted into custom roles.
 * - Enforces database-level uniqueness on role names to prevent race conditions.
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      enum: {
        values: Object.values(ROLES),
        message: "Role name '{VALUE}' is not a valid system role",
      },
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Role description is required"],
      trim: true,
      maxlength: [500, "Role description cannot exceed 500 characters"],
    },
    permissions: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "roles",
  }
);

/**
 * Normalizes and deduplicates assigned permission tokens before saving.
 */
roleSchema.pre("save", function () {
  if (Array.isArray(this.permissions)) {
    this.permissions = [
      ...new Set(this.permissions.map((p) => String(p).trim())),
    ];
  }
});

/**
 * Transforms Mongoose role document into safe client-facing serialization.
 * Excludes internal Mongoose metadata (__v).
 *
 * @returns {Object} Safe public role object.
 */
roleSchema.methods.toSafeRole = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    permissions: this.permissions || [],
    isSystemRole: this.isSystemRole,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Role = mongoose.model("Role", roleSchema);
export default Role;
