// =====================  IMPORTS  ==========================
import mongoose, { Schema } from "mongoose";
import {
  CHARGE_TYPES,
  MAINTENANCE_CONFIG_DEFAULTS,
  MAINTENANCE_CONFIG_LIMITS,
} from "./maintenance-configuration.constants.js";

// =====================  SCHEMA DEFINITION  =================
/**
 * Authoritative Mongoose Schema for Building Maintenance Billing Configurations.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 42.
 * Governing mathematical billing formulas, utility surcharges, grace periods,
 * and late-fee penalties used during monthly invoice generation.
 */
const maintenanceConfigurationSchema = new Schema(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building reference is required"],
      index: true,
    },
    chargeType: {
      type: String,
      enum: {
        values: Object.values(CHARGE_TYPES),
        message: "chargeType must be either FLAT_RATE or PER_SQFT",
      },
      required: [true, "chargeType is required"],
    },
    baseRate: {
      type: Number,
      required: [true, "baseRate is required"],
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_BASE_RATE,
        `baseRate cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_BASE_RATE}`,
      ],
    },
    parkingCharge: {
      type: Number,
      default: MAINTENANCE_CONFIG_DEFAULTS.PARKING_CHARGE,
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
        `parkingCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`,
      ],
    },
    waterCharge: {
      type: Number,
      default: MAINTENANCE_CONFIG_DEFAULTS.WATER_CHARGE,
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
        `waterCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`,
      ],
    },
    sinkingFundCharge: {
      type: Number,
      default: MAINTENANCE_CONFIG_DEFAULTS.SINKING_FUND_CHARGE,
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
        `sinkingFundCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`,
      ],
    },
    lateFeePercentage: {
      type: Number,
      default: MAINTENANCE_CONFIG_DEFAULTS.LATE_FEE_PERCENTAGE,
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_LATE_FEE_PERCENTAGE,
        `lateFeePercentage cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_LATE_FEE_PERCENTAGE}`,
      ],
      max: [
        MAINTENANCE_CONFIG_LIMITS.MAX_LATE_FEE_PERCENTAGE,
        `lateFeePercentage cannot exceed ${MAINTENANCE_CONFIG_LIMITS.MAX_LATE_FEE_PERCENTAGE}`,
      ],
    },
    gracePeriodDays: {
      type: Number,
      default: MAINTENANCE_CONFIG_DEFAULTS.GRACE_PERIOD_DAYS,
      min: [
        MAINTENANCE_CONFIG_LIMITS.MIN_GRACE_PERIOD_DAYS,
        `gracePeriodDays cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_GRACE_PERIOD_DAYS}`,
      ],
      max: [
        MAINTENANCE_CONFIG_LIMITS.MAX_GRACE_PERIOD_DAYS,
        `gracePeriodDays cannot exceed ${MAINTENANCE_CONFIG_LIMITS.MAX_GRACE_PERIOD_DAYS}`,
      ],
    },
    effectiveFrom: {
      type: Date,
      required: [true, "effectiveFrom date is required"],
    },
    isActive: {
      type: Boolean,
      default: MAINTENANCE_CONFIG_DEFAULTS.IS_ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "maintenanceConfigurations",
    versionKey: false,
  }
);

// =====================  INDEXES  ===========================
// Chronological version resolution and historical audit index
maintenanceConfigurationSchema.index({ buildingId: 1, effectiveFrom: -1 });

// High-frequency active configuration resolution index
maintenanceConfigurationSchema.index({ buildingId: 1, isActive: 1 });

// =====================  SERIALIZERS  =======================
/**
 * Formats the document into a sanitized, predictable plain JavaScript object.
 *
 * @returns {Object} Clean configuration data object.
 */
maintenanceConfigurationSchema.methods.toSafeConfiguration = function () {
  return {
    _id: this._id.toString(),
    buildingId: this.buildingId._id
      ? this.buildingId._id.toString()
      : this.buildingId.toString(),
    chargeType: this.chargeType,
    baseRate: this.baseRate,
    parkingCharge: this.parkingCharge,
    waterCharge: this.waterCharge,
    sinkingFundCharge: this.sinkingFundCharge,
    lateFeePercentage: this.lateFeePercentage,
    gracePeriodDays: this.gracePeriodDays,
    effectiveFrom: this.effectiveFrom.toISOString(),
    isActive: this.isActive,
    createdAt: this.createdAt ? this.createdAt.toISOString() : undefined,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
  };
};

// =====================  MODEL COMPILATION  =================
export const MaintenanceConfiguration = mongoose.model(
  "MaintenanceConfiguration",
  maintenanceConfigurationSchema
);

export default MaintenanceConfiguration;
