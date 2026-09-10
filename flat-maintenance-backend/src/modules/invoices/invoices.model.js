// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { INVOICE_STATUS } from "./invoices.constants.js";

// =====================  SUBDOCUMENT SCHEMAS  ==============
/**
 * Invoice line-item subdocument schema.
 * Represents itemized charges (Base Maintenance, Parking, Water, Sinking Fund, Late Fee).
 */
const lineItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Line item title is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    amount: {
      type: Number,
      required: [true, "Line item amount is required"],
      min: [0, "Line item amount cannot be negative"],
    },
  },
  { _id: false }
);

// =====================  INVOICE SCHEMA DEFINITION  =========
/**
 * Invoice Mongoose Model Schema.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 44 and Section 23.
 * Represents financial bills generated during monthly billing cycles or manual runs.
 *
 * Core architectural invariants:
 * - Compound Uniqueness: `{ flatId: 1, billingPeriod: 1 }` prevents duplicate billing for the same flat & period.
 * - Globally Unique Identifier: `invoiceNumber` (e.g. `INV-2026-09-00001`).
 * - Frozen Formula Snapshot: `configurationSnapshot` captures historical formula rates for mathematical reproducibility.
 * - Mathematical Integrity: subTotal = sum(lineItems), totalAmount = subTotal + lateFee, dueAmount = totalAmount - paidAmount.
 */
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building complex ID is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Target flat unit ID is required"],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: [true, "Responsible property owner ID is required"],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    billingPeriod: {
      type: String,
      required: [true, "Billing period (YYYY-MM) is required"],
      trim: true,
      match: [
        /^\d{4}-(0[1-9]|1[0-2])$/,
        "Billing period must match format YYYY-MM",
      ],
      index: true,
    },
    configurationSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Formula configuration snapshot is required"],
    },
    lineItems: {
      type: [lineItemSchema],
      required: [true, "Itemized line items are required"],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Invoice must contain at least one billable line item",
      },
    },
    subTotal: {
      type: Number,
      required: [true, "Subtotal amount is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total billable amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    dueAmount: {
      type: Number,
      required: [true, "Outstanding due amount is required"],
      min: [0, "Due amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, "Late fee cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Invoice payment due date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(INVOICE_STATUS),
        message: "Invalid invoice status specified: {VALUE}",
      },
      default: INVOICE_STATUS.ISSUED,
      index: true,
    },
    paidAt: {
      type: Date,
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
    collection: "invoices",
  }
);

// =====================  INDEXES  ===========================
// Idempotency constraint: exactly ONE invoice per flat per billing period
invoiceSchema.index(
  { flatId: 1, billingPeriod: 1 },
  { unique: true, name: "uniq_flat_billing_period" }
);

// High-frequency query indexes
invoiceSchema.index(
  { buildingId: 1, billingPeriod: 1 },
  { name: "idx_building_billing_period" }
);

invoiceSchema.index(
  { buildingId: 1, status: 1 },
  { name: "idx_building_status" }
);

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms Mongoose invoice document into a clean, safe DTO.
 *
 * @returns {Object} Plain JavaScript invoice presentation object.
 */
invoiceSchema.methods.toSafeInvoice = function () {
  return {
    id: this._id.toString(),
    invoiceNumber: this.invoiceNumber,
    buildingId: this.buildingId ? this.buildingId.toString() : null,
    flatId: this.flatId ? this.flatId.toString() : null,
    ownerId: this.ownerId ? this.ownerId.toString() : null,
    tenantId: this.tenantId ? this.tenantId.toString() : null,
    billingPeriod: this.billingPeriod,
    configurationSnapshot: this.configurationSnapshot,
    lineItems: this.lineItems.map((item) => ({
      title: item.title,
      amount: item.amount,
    })),
    subTotal: this.subTotal,
    totalAmount: this.totalAmount,
    dueAmount: this.dueAmount,
    paidAmount: this.paidAmount,
    lateFee: this.lateFee,
    dueDate: this.dueDate ? this.dueDate.toISOString() : null,
    status: this.status,
    paidAt: this.paidAt ? this.paidAt.toISOString() : null,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

// =====================  MODEL COMPILATION  =================
export const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
