import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ROLES } from "../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../constants/status.constant.js";
import { AUTH_CONSTANTS } from "../modules/auth/auth.constants.js";

/**
 * Subdocument schema representing an issued Refresh Token session.
 *
 * Security Invariants:
 * - The raw plaintext refresh JWT is NEVER stored in MongoDB.
 * - Only the SHA-256 hash (tokenHash) is persisted.
 * - Single-use semantics: isUsed begins false; on refresh it transitions atomically to true.
 * - Presentation of an isUsed=true token triggers immediate family revocation (theft detection).
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    familyId: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: true }
);

/**
 * User Identity and Authentication Model Schema.
 *
 * Core architectural invariant:
 * Every authenticated principal (Super Admin, Building Admin, Manager, Accountant,
 * Staff, Owner, Tenant) possesses exactly one record in the `users` collection.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 64,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: 2,
      maxlength: 64,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.status !== ACCOUNT_STATUS.PENDING;
      },
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.TENANT,
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },
    assignedBuildingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Building",
        index: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.PENDING,
      required: true,
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    invitationTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    invitationExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
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
  }
);

// Compound partial unique index: enforce unique emails only among non-deleted accounts
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Indexes on refresh tokens subdocument array for high-performance session lookup
userSchema.index({ "refreshTokens.jti": 1 });
userSchema.index({ "refreshTokens.tokenHash": 1 });
userSchema.index({ "refreshTokens.familyId": 1 });

// Directory query optimization indexes
userSchema.index({ assignedBuildingIds: 1, role: 1, status: 1, isDeleted: 1 });
userSchema.index({ firstName: "text", lastName: "text", email: "text" });

/**
 * Pre-save Mongoose Hook for Bcrypt Password Hashing.
 *
 * Invariants:
 * - Hashed strictly using 12 salt rounds as mandated by FR-AUTH-01.
 * - Runs ONLY if the password field was explicitly modified.
 * - Prevents accidental double-hashing on unrelated profile updates.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const saltRounds =
    Number(process.env.BCRYPT_SALT_ROUNDS) || AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

/**
 * Compares a candidate plaintext password against the stored bcrypt hash.
 *
 * @param {string} candidatePassword - Plaintext password from login request.
 * @returns {Promise<boolean>} True if password matches hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if the account is currently locked due to failed login attempts.
 *
 * @returns {boolean} True if lockout timestamp is in the future.
 */
userSchema.methods.isAccountLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Serializes the user document into a sanitized, safe public identity object.
 *
 * Security Boundary:
 * Guarantee that:
 * - Passwords and password hashes never escape.
 * - Refresh token arrays and token hashes never escape.
 * - Reset and invitation tokens never escape.
 *
 * @returns {Object} Safe public identity representation.
 */
userSchema.methods.toSafeUser = function () {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone || null,
    role: this.role,
    roleId: this.roleId ? this.roleId.toString() : undefined,
    assignedBuildingIds: (this.assignedBuildingIds || []).map((id) =>
      id.toString()
    ),
    status: this.status,
    avatarUrl: this.avatarUrl || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
