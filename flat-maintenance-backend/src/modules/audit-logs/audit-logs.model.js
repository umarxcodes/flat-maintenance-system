// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";

// =====================  SCHEMA DEFINITION  =================
/**
 * Authoritative Mongoose Schema for Module 24: Audit Logs & Append-Only Event Trail (auditLogs).
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 54, Section 63, and ADR-012.
 * Provides an immutable, tamper-resistant forensic audit tracking mechanism for sensitive data mutations.
 *
 * Invariants:
 * - Append-Only: No updates, replacements, or deletions are permitted under any circumstance.
 * - Forensic Timeline: Index on { resourceId: 1, createdAt: -1 } enables historical reconstruction.
 * - Building Scoped: Index on { buildingId: 1, createdAt: -1 } supports tenant-isolated audit retrieval.
 * - No Soft-Delete: Records are permanent historical artifacts without isDeleted or deletedAt fields.
 */
const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: [true, "Audit action is strictly required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Authoritative actorUserId is strictly required"],
      index: true,
    },
    actorRole: {
      type: String,
      required: [true, "Historical actorRole is strictly required"],
      trim: true,
      uppercase: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      default: null,
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, "Target resourceType is strictly required"],
      trim: true,
      uppercase: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: [true, "Target resourceId is strictly required"],
      index: true,
    },
    beforeState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
    correlationId: {
      type: String,
      trim: true,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: "auditLogs",
  }
);

// =====================  COMPOUND QUERY INDEXES  ============
// Forensic entity timeline for resource-specific investigation
auditLogSchema.index({ resourceId: 1, createdAt: -1 });

// Building-scoped administrative audit trail
auditLogSchema.index({ buildingId: 1, createdAt: -1 });

// Actor activity timeline
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });

// Action category timeline
auditLogSchema.index({ action: 1, createdAt: -1 });

// =====================  IMMUTABILITY MIDDLEWARE  ===========
/**
 * Model-level mutation prevention hooks.
 * Rejects any query or instance operation attempting to update, replace, or delete audit records.
 */
const disallowMutation = function () {
  throw new Error(
    "AuditLog is an append-only collection. Modifications and deletions are strictly prohibited."
  );
};

const updateOperations = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findByIdAndUpdate",
  "replaceOne",
  "findOneAndReplace",
];

const deleteOperations = [
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
  "findByIdAndDelete",
];

auditLogSchema.pre(updateOperations, disallowMutation);
auditLogSchema.pre(deleteOperations, disallowMutation);

auditLogSchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error(
      "AuditLog records are immutable and cannot be modified after creation."
    );
  }
});

// =====================  MODEL EXPORT  ======================
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
