// =====================  EXPENSE CATEGORIES  ==============
/**
 * Canonical society operational expense category classification.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 50.
 */
export const EXPENSE_CATEGORY = Object.freeze({
  UTILITIES: "UTILITIES",
  SECURITY_SALARIES: "SECURITY_SALARIES",
  MAINTENANCE_AMC: "MAINTENANCE_AMC",
  REPAIRS: "REPAIRS",
  CLEANING_SUPPLIES: "CLEANING_SUPPLIES",
  LEGAL: "LEGAL",
  OTHER: "OTHER",
});

// =====================  EXPENSE STATUSES  =================
/**
 * Lifecycle state transitions for operational expenses.
 * Default: PENDING_APPROVAL.
 */
export const EXPENSE_STATUS = Object.freeze({
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
});

// =====================  PAYLOAD BOUNDARIES  ===============
/**
 * Strict length, monetary, and retry boundaries for expense entries.
 */
export const EXPENSE_LIMITS = Object.freeze({
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 160,
  VENDOR_MIN_LENGTH: 2,
  VENDOR_MAX_LENGTH: 120,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 10000000.0,
  MAX_RETRY_ATTEMPTS: 3,
});

// =====================  PAGINATION DEFAULTS  ==============
/**
 * Standard pagination defaults and safety limits for expense records query.
 */
export const EXPENSE_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
