// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import {
  VISITOR_TYPES,
  VISITOR_STATUS,
  VISITOR_CONSTRAINTS,
} from "./visitors.constants.js";

// =====================  SCHEMA DEFINITION  =================
const visitorSchema = new mongoose.Schema(
  {
    passCode: {
      type: String,
      required: [true, "Pass code is required"],
      unique: true,
      trim: true,
      match: [
        VISITOR_CONSTRAINTS.PASSCODE_REGEX,
        "Pass code must be exactly 6 numeric digits",
      ],
    },
    qrToken: {
      type: String,
      required: [true, "Cryptographic QR verification token is required"],
      trim: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building reference is required"],
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat reference is required"],
      index: true,
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host user reference is required"],
      index: true,
    },
    visitorName: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
      minlength: [
        VISITOR_CONSTRAINTS.MIN_NAME_LENGTH,
        "Visitor name must be at least 2 characters",
      ],
      maxlength: [
        VISITOR_CONSTRAINTS.MAX_NAME_LENGTH,
        "Visitor name cannot exceed 100 characters",
      ],
    },
    visitorPhone: {
      type: String,
      trim: true,
      default: null,
      maxlength: [
        VISITOR_CONSTRAINTS.MAX_PHONE_LENGTH,
        "Visitor phone cannot exceed 20 characters",
      ],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: null,
      uppercase: true,
      maxlength: [
        VISITOR_CONSTRAINTS.MAX_VEHICLE_LENGTH,
        "Vehicle number cannot exceed 20 characters",
      ],
    },
    visitorType: {
      type: String,
      enum: {
        values: Object.values(VISITOR_TYPES),
        message: "Invalid visitor classification type: {VALUE}",
      },
      required: [true, "Visitor classification type is required"],
    },
    visitorCount: {
      type: Number,
      default: VISITOR_CONSTRAINTS.DEFAULT_VISITOR_COUNT,
      min: [
        VISITOR_CONSTRAINTS.MIN_VISITOR_COUNT,
        "Visitor count must be at least 1",
      ],
      max: [
        VISITOR_CONSTRAINTS.MAX_VISITOR_COUNT,
        "Visitor count cannot exceed 50",
      ],
    },
    expectedArrivalDate: {
      type: Date,
      required: [true, "Expected arrival date is required"],
    },
    entryTimestamp: {
      type: Date,
      default: null,
    },
    exitTimestamp: {
      type: Date,
      default: null,
    },
    verifiedByStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VISITOR_STATUS),
        message: "Invalid visitor status: {VALUE}",
      },
      default: VISITOR_STATUS.EXPECTED,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Compound indexes for gate security search and host activity lookups
visitorSchema.index({ buildingId: 1, status: 1 });
visitorSchema.index({ buildingId: 1, expectedArrivalDate: -1 });
visitorSchema.index({ hostUserId: 1, expectedArrivalDate: -1 });

// =====================  INSTANCE METHODS  ==================
/**
 * Evaluates whether an EXPECTED pass has expired based on the 24-hour business rule.
 *
 * @returns {boolean}
 */
visitorSchema.methods.isExpired = function () {
  if (this.status !== VISITOR_STATUS.EXPECTED) {
    return false;
  }
  const expiryTime =
    new Date(this.expectedArrivalDate).getTime() +
    VISITOR_CONSTRAINTS.EXPIRATION_MS;
  return Date.now() > expiryTime;
};

/**
 * Returns safe external representation of the visitor pass.
 *
 * @returns {Object}
 */
visitorSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    passCode: this.passCode,
    qrToken: this.qrToken,
    buildingId: this.buildingId,
    flatId: this.flatId,
    hostUserId: this.hostUserId,
    visitorName: this.visitorName,
    visitorPhone: this.visitorPhone,
    vehicleNumber: this.vehicleNumber,
    visitorType: this.visitorType,
    visitorCount: this.visitorCount,
    expectedArrivalDate: this.expectedArrivalDate,
    entryTimestamp: this.entryTimestamp,
    exitTimestamp: this.exitTimestamp,
    verifiedByStaffId: this.verifiedByStaffId,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =====================  MODEL EXPORT  ======================
export const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
