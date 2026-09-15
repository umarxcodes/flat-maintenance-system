// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative Constants, Boundaries, and Pure Helpers for Module 23: Reports & Analytics Engine (reports).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 53.
 */

// =====================  PERIOD REGEX PATTERN  ==============
/**
 * Canonical ISO billing period format regex: YYYY-MM (e.g. 2026-09)
 */
export const BILLING_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

// =====================  SECURITY AUDIT EVENTS  =============
export const REPORT_SECURITY_EVENTS = Object.freeze({
  REPORT_COLLECTIONS_ACCESSED: "REPORT_COLLECTIONS_ACCESSED",
  REPORT_STAFF_PERFORMANCE_ACCESSED: "REPORT_STAFF_PERFORMANCE_ACCESSED",
  REPORT_COMPLAINT_SLA_ACCESSED: "REPORT_COMPLAINT_SLA_ACCESSED",
});

// =====================  PURE ANALYTICAL HELPERS  ===========
/**
 * Calculates collection rate percentage safely handling zero denominators.
 *
 * @param {number} collected - Total collected amount.
 * @param {number} billed - Total collectible billed amount.
 * @returns {number} Percentage formatted to 2 decimal places (0.00 - 100.00).
 */
export const calculateCollectionRate = (collected, billed) => {
  if (!billed || billed <= 0) {
    return 0;
  }
  const rate = (collected / billed) * 100;
  return Number(rate.toFixed(2));
};

/**
 * Calculates ticket resolution duration in hours.
 *
 * @param {Date|string} startedAt - Work order start timestamp.
 * @param {Date|string} completedAt - Work order completion timestamp.
 * @returns {number} Duration in elapsed hours rounded to 2 decimal places.
 */
export const calculateResolutionVelocityHours = (startedAt, completedAt) => {
  if (!startedAt || !completedAt) {
    return 0;
  }
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(completedAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 0;
  }
  const diffHours = (endMs - startMs) / (1000 * 60 * 60);
  return Number(diffHours.toFixed(2));
};

/**
 * Calculates on-time SLA compliance percentage.
 *
 * @param {number} onTimeCount - Number of work orders completed before or at SLA deadline.
 * @param {number} totalCompleted - Total number of completed work orders with SLA deadlines.
 * @returns {number} Compliance percentage (0.00 - 100.00).
 */
export const calculateSlaComplianceRate = (onTimeCount, totalCompleted) => {
  if (!totalCompleted || totalCompleted <= 0) {
    return 0;
  }
  const rate = (onTimeCount / totalCompleted) * 100;
  return Number(rate.toFixed(2));
};
