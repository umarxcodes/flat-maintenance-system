// =====================  IMPORTS  ==========================
import {
  roundCurrency,
  calculateBaseMaintenanceCharge,
} from "../maintenance-configurations/maintenance-configuration.calculator.js";
import { CHARGE_TYPES } from "../maintenance-configurations/maintenance-configuration.constants.js";
import { BILLING_PERIOD_REGEX } from "./invoices.constants.js";

// =====================  PURE CALCULATION FUNCTIONS  ========
/**
 * Pure, side-effect-free Financial Calculation Engine for Invoices.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 23 and Section 44.
 */

/**
 * Constructs deterministic, itemized line items from a flat unit and configuration snapshot.
 *
 * Sourced from Section 23:
 * - FLAT_RATE: baseRate + parkingCharge + waterCharge
 * - PER_SQFT:  (baseRate * areaSqFt) + parkingCharge + waterCharge
 *
 * @param {Object} params - Formula parameters.
 * @param {string} params.chargeType - 'FLAT_RATE' or 'PER_SQFT'.
 * @param {number} params.baseRate - Base billing rate.
 * @param {number} [params.areaSqFt=0] - Flat area in square feet.
 * @param {number} [params.parkingCharge=0] - Parking surcharge.
 * @param {number} [params.waterCharge=0] - Water utility surcharge.
 * @param {number} [params.sinkingFundCharge=0] - Sinking fund contribution.
 * @param {boolean} [params.includeSinkingFund=false] - Optional sinking fund flag.
 * @returns {Array<{title: string, amount: number}>} Itemized line items array.
 */
export const generateLineItems = ({
  chargeType,
  baseRate,
  areaSqFt = 0,
  parkingCharge = 0,
  waterCharge = 0,
  sinkingFundCharge = 0,
  includeSinkingFund = false,
}) => {
  const lineItems = [];

  const safeArea = Number(areaSqFt) || 0;
  const safeParking = Number(parkingCharge) || 0;
  const safeWater = Number(waterCharge) || 0;
  const safeSinking = includeSinkingFund ? Number(sinkingFundCharge) || 0 : 0;

  // 1. Base Maintenance Line Item
  if (chargeType === CHARGE_TYPES.FLAT_RATE) {
    lineItems.push({
      title: "Base Maintenance Charge",
      amount: roundCurrency(baseRate),
    });
  } else if (chargeType === CHARGE_TYPES.PER_SQFT) {
    lineItems.push({
      title: "Base Maintenance Charge",
      amount: roundCurrency(baseRate * safeArea),
    });
  }

  // 2. Parking Utility Surcharge
  if (safeParking > 0) {
    lineItems.push({
      title: "Parking Charge",
      amount: roundCurrency(safeParking),
    });
  }

  // 3. Water Utility Surcharge
  if (safeWater > 0) {
    lineItems.push({
      title: "Water Utility Charge",
      amount: roundCurrency(safeWater),
    });
  }

  // 4. Sinking Fund Contribution (If active)
  if (safeSinking > 0) {
    lineItems.push({
      title: "Sinking Fund Contribution",
      amount: roundCurrency(safeSinking),
    });
  }

  return lineItems;
};

/**
 * Calculates complete invoice amounts ensuring mathematical consistency across
 * line items, subTotal, totalAmount, and initial dueAmount.
 *
 * Invariant:
 * subTotal = sum(lineItems)
 * totalAmount = subTotal + lateFee (lateFee is 0 at issuance)
 * dueAmount = totalAmount - paidAmount (paidAmount is 0 at issuance)
 *
 * @param {Object} params - Formula parameters.
 * @returns {{ lineItems: Array<{title: string, amount: number}>, subTotal: number, totalAmount: number, dueAmount: number }}
 */
export const calculateInvoiceAmounts = (params) => {
  const lineItems = generateLineItems(params);

  // Calculate mathematically consistent subtotal from itemized components
  const calculatedSubTotal = lineItems.reduce(
    (acc, item) => acc + item.amount,
    0
  );
  const subTotal = roundCurrency(calculatedSubTotal);

  // Verify against Section 23 base charge calculation
  const verifiedBase = calculateBaseMaintenanceCharge(params);
  if (subTotal !== verifiedBase) {
    throw new Error(
      `Mathematical inconsistency: Subtotal (${subTotal}) does not match calculated base charge (${verifiedBase})`
    );
  }

  const totalAmount = subTotal;
  const dueAmount = totalAmount;

  return {
    lineItems,
    subTotal,
    totalAmount,
    dueAmount,
  };
};

/**
 * Calculates outstanding due balance after applying payments.
 *
 * @param {number} totalAmount - Total invoice billable amount.
 * @param {number} [paidAmount=0] - Total settled payment amount.
 * @returns {number} Non-negative remaining due amount.
 */
export const calculateDueAmount = (totalAmount, paidAmount = 0) => {
  const total = roundCurrency(Number(totalAmount) || 0);
  const paid = roundCurrency(Number(paidAmount) || 0);
  return roundCurrency(Math.max(0, total - paid));
};

/**
 * Resolves the canonical billing due date.
 * If explicit dueDate is provided, validates and normalizes it.
 * Otherwise, defaults deterministically to the 15th of the billing period month.
 *
 * @param {string} billingPeriod - Billing period string (YYYY-MM).
 * @param {Date|string} [explicitDueDate] - Optional explicit due date.
 * @returns {Date} Normalized due date Date object.
 */
export const resolveBillingDueDate = (billingPeriod, explicitDueDate) => {
  if (explicitDueDate) {
    const parsed = new Date(explicitDueDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError("Invalid explicit dueDate provided");
    }
    return parsed;
  }

  if (!BILLING_PERIOD_REGEX.test(billingPeriod)) {
    throw new Error(
      `Invalid billingPeriod format: '${billingPeriod}' (must be YYYY-MM)`
    );
  }

  const [yearStr, monthStr] = billingPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed

  // Construct canonical 15th of billing period month in UTC
  return new Date(Date.UTC(year, monthIndex, 15, 23, 59, 59, 999));
};
