// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { PAYMENT_METHODS } from "./payments.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Payment Financial Ledger Mongoose Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 45.2,
 * Section 23, and ADR-012.
 *
 * Architectural Invariants:
 * - Append-Only Financial Ledger: Records are strictly immutable once persisted.
 * - Multi-Document ACID Settlement: Subordinate to Invoices; settlements occur in atomic sessions.
 * - Traceability: Authoritatively tied to buildingId, flatId, invoiceId, and payerUserId.
 * - Global Uniqueness: Unique indexed constraints on paymentNumber and receiptNumber.
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: [true, "Payment number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Associated invoice ID is required"],
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Associated building complex ID is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Associated flat unit ID is required"],
      index: true,
    },
    payerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payer user ID is required"],
      index: true,
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0.01, "Amount paid must be strictly positive"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: "Invalid payment method: {VALUE}",
      },
      required: [true, "Payment method is required"],
      index: true,
    },
    transactionRef: {
      type: String,
      default: null,
      trim: true,
      maxlength: [100, "Transaction reference cannot exceed 100 characters"],
    },
    receiptNumber: {
      type: String,
      required: [true, "Receipt number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    receiptPdfUrl: {
      type: String,
      default: null,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
paymentSchema.index({ buildingId: 1, paymentDate: -1 });
paymentSchema.index({ flatId: 1, paymentDate: -1 });
paymentSchema.index({ invoiceId: 1, paymentDate: -1 });
paymentSchema.index({ payerUserId: 1, paymentDate: -1 });

// =====================  IMMUTABILITY HOOKS  ================
/**
 * ADR-012: Enforce append-only ledger immutability.
 * Blocks all updates and deletions at the model schema layer.
 */
paymentSchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error(
      "Financial Ledger Mutation Rejected: Payments are append-only immutable records"
    );
  }
});

paymentSchema.pre(
  [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "findByIdAndUpdate",
    "replaceOne",
  ],
  function () {
    throw new Error(
      "Financial Ledger Mutation Rejected: Payment updates are strictly prohibited"
    );
  }
);

paymentSchema.pre(
  ["deleteOne", "deleteMany", "findOneAndDelete", "findByIdAndDelete"],
  function () {
    throw new Error(
      "Financial Ledger Deletion Rejected: Payment records cannot be deleted"
    );
  }
);

// =====================  TRANSFORMATION METHODS  ===========
/**
 * Safe DTO presentation projection stripping internal Mongoose metadata.
 */
paymentSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    paymentNumber: this.paymentNumber,
    invoiceId: this.invoiceId?.toString() || this.invoiceId,
    buildingId: this.buildingId?.toString() || this.buildingId,
    flatId: this.flatId?.toString() || this.flatId,
    payerUserId: this.payerUserId?.toString() || this.payerUserId,
    amountPaid: this.amountPaid,
    paymentMethod: this.paymentMethod,
    transactionRef: this.transactionRef,
    receiptNumber: this.receiptNumber,
    receiptPdfUrl: this.receiptPdfUrl,
    paymentDate: this.paymentDate,
    notes: this.notes,
    createdAt: this.createdAt,
  };
};

// =====================  MODEL COMPILATION & EXPORT  ========
export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
