// =====================  IMPORTS  ==========================
import mongoose from "mongoose";

// =====================  OUTBOX SCHEMA DEFINITION  ==========
/**
 * Transactional Outbox Event Mongoose Model Schema.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 26, ADR-009, and Section 23.
 *
 * Guarantees zero lost domain events by capturing outgoing events atomically
 * within the same ACID MongoDB transaction as the domain state mutation.
 */
const outboxSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, "Unique eventId is required"],
      unique: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, "Outbox eventType is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Outbox event payload is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "PROCESSED", "FAILED"],
        message: "Invalid outbox status: {VALUE}",
      },
      default: "PENDING",
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, "Retry count cannot be negative"],
    },
    processedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
outboxSchema.index({ status: 1, createdAt: 1 });
outboxSchema.index({ eventType: 1, createdAt: -1 });

// =====================  MODEL COMPILATION & EXPORT  ========
export const Outbox =
  mongoose.models.Outbox || mongoose.model("Outbox", outboxSchema);

export default Outbox;
