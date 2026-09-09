import mongoose from "mongoose";
import { PERMISSION_MODULES } from "../modules/permissions/permissions.constants.js";

/**
 * Canonical Platform Permission Definition Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 34.
 *
 * Core Responsibilities:
 * - Represents granular, machine-readable platform capabilities.
 * - Categorizes permissions by domain module.
 * - Enforces database-level uniqueness on permission codes to prevent race conditions.
 * - Excludes internal Mongoose metadata (__v) from client serializations.
 */
const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Permission code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    module: {
      type: String,
      required: [true, "Domain module is required"],
      enum: {
        values: Object.values(PERMISSION_MODULES),
        message: "Module '{VALUE}' is not a valid domain module",
      },
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Permission description is required"],
      trim: true,
      maxlength: [500, "Permission description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    collection: "permissions",
  }
);

/**
 * Pre-save normalization hook.
 * Guarantees uppercase and trimmed format for machine-readable codes and module enums.
 */
permissionSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
  if (this.module) {
    this.module = this.module.trim().toUpperCase();
  }
  if (this.description) {
    this.description = this.description.trim();
  }
});

/**
 * Transforms Mongoose permission document into safe client-facing serialization.
 * Returns only documented public permission fields (id, code, module, description).
 * Excludes internal Mongoose metadata (__v).
 *
 * @returns {Object} Safe public permission object.
 */
permissionSchema.methods.toSafePermission = function () {
  return {
    id: this._id.toString(),
    code: this.code,
    module: this.module,
    description: this.description,
  };
};

export const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
