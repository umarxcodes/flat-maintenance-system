// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import {
  EXPENSE_CATEGORY,
  EXPENSE_STATUS,
  EXPENSE_LIMITS,
} from "./expenses.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Mongoose schema for society operational expenses.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 50.
 */
const expenseSchema = new Schema(
  {
    expenseNumber: {
      type: String,
      required: [true, "Expense number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      minlength: [
        EXPENSE_LIMITS.TITLE_MIN_LENGTH,
        `Expense title must be at least ${EXPENSE_LIMITS.TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        EXPENSE_LIMITS.TITLE_MAX_LENGTH,
        `Expense title cannot exceed ${EXPENSE_LIMITS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      minlength: [
        EXPENSE_LIMITS.VENDOR_MIN_LENGTH,
        `Vendor name must be at least ${EXPENSE_LIMITS.VENDOR_MIN_LENGTH} characters`,
      ],
      maxlength: [
        EXPENSE_LIMITS.VENDOR_MAX_LENGTH,
        `Vendor name cannot exceed ${EXPENSE_LIMITS.VENDOR_MAX_LENGTH} characters`,
      ],
    },
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: {
        values: Object.values(EXPENSE_CATEGORY),
        message: "Invalid expense category '{VALUE}'",
      },
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [
        EXPENSE_LIMITS.AMOUNT_MIN,
        `Expense amount must be at least ${EXPENSE_LIMITS.AMOUNT_MIN}`,
      ],
      max: [
        EXPENSE_LIMITS.AMOUNT_MAX,
        `Expense amount cannot exceed ${EXPENSE_LIMITS.AMOUNT_MAX}`,
      ],
      validate: {
        validator: (val) =>
          Number.isFinite(val) &&
          val > 0 &&
          Math.round(val * 100) === val * 100,
        message:
          "Expense amount must be a finite positive number with at most 2 decimal places",
      },
    },
    receiptUrl: {
      type: String,
      trim: true,
      default: null,
    },
    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user ID is required"],
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(EXPENSE_STATUS),
        message: "Invalid expense status '{VALUE}'",
      },
      default: EXPENSE_STATUS.PENDING_APPROVAL,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "expenses",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Compound chronological ledger index for high-performance financial reporting
expenseSchema.index({ buildingId: 1, expenseDate: -1 });

// Compound category filtered ledger index
expenseSchema.index({ buildingId: 1, category: 1, expenseDate: -1 });

// Compound status triage index (fast lookup of pending approvals)
expenseSchema.index({ buildingId: 1, status: 1 });

// =====================  INSTANCE METHODS  ==================
/**
 * Transforms Expense document into a clean, safe DTO.
 *
 * @returns {Object} Standardized expense presentation object.
 */
expenseSchema.methods.toSafeExpense = function () {
  return {
    _id: this._id.toString(),
    id: this._id.toString(),
    expenseNumber: this.expenseNumber,
    buildingId: this.buildingId?._id
      ? this.buildingId._id.toString()
      : this.buildingId?.toString() || null,
    title: this.title,
    vendorName: this.vendorName,
    category: this.category,
    amount: this.amount,
    receiptUrl: this.receiptUrl || null,
    expenseDate:
      this.expenseDate instanceof Date
        ? this.expenseDate.toISOString()
        : this.expenseDate,
    createdById: this.createdById?._id
      ? this.createdById._id.toString()
      : this.createdById?.toString() || null,
    approvedById: this.approvedById?._id
      ? this.approvedById._id.toString()
      : this.approvedById?.toString() || null,
    status: this.status,
    createdAt:
      this.createdAt instanceof Date
        ? this.createdAt.toISOString()
        : this.createdAt,
    updatedAt:
      this.updatedAt instanceof Date
        ? this.updatedAt.toISOString()
        : this.updatedAt,
  };
};

// =====================  MODEL REGISTRATION  ================
export const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
