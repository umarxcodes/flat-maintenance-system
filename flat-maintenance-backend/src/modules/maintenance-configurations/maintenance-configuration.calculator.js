// =====================  IMPORTS  ==========================
import { CHARGE_TYPES } from "./maintenance-configuration.constants.js";

// =====================  PRECISION HELPERS  =================
/**
 * Rounds a financial currency amount to 2 decimal places using Number.EPSILON
 * to prevent IEEE 754 floating-point inaccuracies.
 *
 * @param {number} amount - Numeric amount to round.
 * @returns {number} Deterministic currency value with 2 decimal places.
 */
export const roundCurrency = (amount) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("Financial amount must be a finite number");
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

// =====================  PURE CALCULATION FUNCTIONS  ========
/**
 * Calculates the base monthly maintenance billable amount for a flat unit.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 23:
 * - FLAT_RATE: baseRate + parkingCharge + waterCharge
 * - PER_SQFT:  (baseRate * flat.areaSqFt) + parkingCharge + waterCharge
 *
 * DOCUMENTATION CONFLICT NOTE:
 * SinkingFundCharge exists in the database schema (Section 42) with default 0,
 * but is omitted from the documented mathematical formula in Section 23.
 * By default, this function adheres strictly to Section 23, but provides an
 * explicit `includeSinkingFund` option for forward compatibility.
 *
 * @param {Object} params - Formula parameters.
 * @param {string} params.chargeType - 'FLAT_RATE' or 'PER_SQFT'.
 * @param {number} params.baseRate - Base rate per month or per sqft.
 * @param {number} [params.areaSqFt=0] - Total flat area in square feet.
 * @param {number} [params.parkingCharge=0] - Additional monthly parking fee.
 * @param {number} [params.waterCharge=0] - Additional monthly water utility fee.
 * @param {number} [params.sinkingFundCharge=0] - Sinking fund contribution.
 * @param {boolean} [params.includeSinkingFund=false] - Whether to include sinking fund.
 * @returns {number} Rounded total base maintenance amount.
 */
export const calculateBaseMaintenanceCharge = ({
  chargeType,
  baseRate,
  areaSqFt = 0,
  parkingCharge = 0,
  waterCharge = 0,
  sinkingFundCharge = 0,
  includeSinkingFund = false,
}) => {
  if (![CHARGE_TYPES.FLAT_RATE, CHARGE_TYPES.PER_SQFT].includes(chargeType)) {
    throw new Error(`Invalid chargeType: ${chargeType}`);
  }

  if (
    typeof baseRate !== "number" ||
    !Number.isFinite(baseRate) ||
    baseRate < 0
  ) {
    throw new TypeError("baseRate must be a non-negative finite number");
  }

  const safeArea = Number(areaSqFt) || 0;
  const safeParking = Number(parkingCharge) || 0;
  const safeWater = Number(waterCharge) || 0;
  const safeSinking = includeSinkingFund ? Number(sinkingFundCharge) || 0 : 0;

  if (chargeType === CHARGE_TYPES.FLAT_RATE) {
    return roundCurrency(baseRate + safeParking + safeWater + safeSinking);
  }

  // PER_SQFT
  return roundCurrency(
    baseRate * safeArea + safeParking + safeWater + safeSinking
  );
};

/**
 * Calculates late fee penalty amount for an overdue invoice.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 23:
 * LateFee = BillableAmount * (lateFeePercentage / 100)
 *
 * @param {Object} params - Late fee parameters.
 * @param {number} params.billableAmount - Principal invoice amount.
 * @param {number} params.lateFeePercentage - Late fee percentage (e.g. 5.0 for 5%).
 * @returns {number} Rounded late fee amount.
 */
export const calculateLateFee = ({ billableAmount, lateFeePercentage }) => {
  if (
    typeof billableAmount !== "number" ||
    !Number.isFinite(billableAmount) ||
    billableAmount < 0
  ) {
    throw new TypeError("billableAmount must be a non-negative finite number");
  }

  if (
    typeof lateFeePercentage !== "number" ||
    !Number.isFinite(lateFeePercentage) ||
    lateFeePercentage < 0
  ) {
    throw new TypeError(
      "lateFeePercentage must be a non-negative finite number"
    );
  }

  return roundCurrency(billableAmount * (lateFeePercentage / 100));
};

/**
 * Determines whether a payment is overdue based on due date and grace period days.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 23:
 * Overdue if payment occurs strictly after (dueDate + gracePeriodDays).
 *
 * @param {Object} params - Boundary parameters.
 * @param {Date|string|number} params.dueDate - Official invoice due date.
 * @param {number} params.gracePeriodDays - Number of grace days allowed.
 * @param {Date|string|number} [params.paymentDate=new Date()] - Date payment was attempted.
 * @returns {boolean} True if payment timestamp exceeds the grace period boundary.
 */
export const isPaymentOverdue = ({
  dueDate,
  gracePeriodDays,
  paymentDate = new Date(),
}) => {
  const due = new Date(dueDate).getTime();
  const payment = new Date(paymentDate).getTime();
  const graceMs = (Number(gracePeriodDays) || 0) * 24 * 60 * 60 * 1000;

  if (Number.isNaN(due) || Number.isNaN(payment)) {
    throw new TypeError("dueDate and paymentDate must be valid dates");
  }

  const cutoffTime = due + graceMs;
  return payment > cutoffTime;
};

/**
 * Generates an immutable configuration snapshot object for downstream Invoice generation.
 *
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 44:
 * invoices.configurationSnapshot retains formula parameters for mathematical auditability.
 *
 * @param {Object} config - MaintenanceConfiguration document or plain object.
 * @returns {Object} Immutable formula snapshot.
 */
export const createConfigurationSnapshot = (config) => {
  if (!config) {
    throw new Error("Configuration is required to generate snapshot");
  }

  return Object.freeze({
    configurationId: config._id ? config._id.toString() : undefined,
    buildingId: config.buildingId
      ? config.buildingId._id
        ? config.buildingId._id.toString()
        : config.buildingId.toString()
      : undefined,
    chargeType: config.chargeType,
    baseRate: config.baseRate,
    parkingCharge: config.parkingCharge,
    waterCharge: config.waterCharge,
    sinkingFundCharge: config.sinkingFundCharge,
    lateFeePercentage: config.lateFeePercentage,
    gracePeriodDays: config.gracePeriodDays,
    effectiveFrom: config.effectiveFrom
      ? new Date(config.effectiveFrom).toISOString()
      : undefined,
  });
};
