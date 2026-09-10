// =====================  CHARGE TYPE ENUMS  ==================
/**
 * Supported maintenance calculation charge algorithms.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 42.
 */
export const CHARGE_TYPES = Object.freeze({
  FLAT_RATE: "FLAT_RATE",
  PER_SQFT: "PER_SQFT",
});

// =====================  FINANCIAL DEFAULTS  ================
/**
 * Authoritative default values for maintenance billing components.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 42.
 */
export const MAINTENANCE_CONFIG_DEFAULTS = Object.freeze({
  PARKING_CHARGE: 0,
  WATER_CHARGE: 0,
  SINKING_FUND_CHARGE: 0,
  LATE_FEE_PERCENTAGE: 5.0,
  GRACE_PERIOD_DAYS: 10,
  IS_ACTIVE: true,
});

// =====================  DOMAIN BOUNDARIES & LIMITS  =========
/**
 * Validation boundary constraints for billing parameters.
 */
export const MAINTENANCE_CONFIG_LIMITS = Object.freeze({
  MIN_BASE_RATE: 0,
  MIN_CHARGE: 0,
  MIN_LATE_FEE_PERCENTAGE: 0,
  MAX_LATE_FEE_PERCENTAGE: 100,
  MIN_GRACE_PERIOD_DAYS: 0,
  MAX_GRACE_PERIOD_DAYS: 365,
});

// =====================  PAGINATION STANDARDS  ==============
/**
 * Pagination boundaries for historical rate audits.
 */
export const MAINTENANCE_CONFIG_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
});

// =====================  CANONICAL CONSTANTS AGGREGATE  ======
export const MAINTENANCE_CONFIG_CONSTANTS = Object.freeze({
  CHARGE_TYPES,
  DEFAULTS: MAINTENANCE_CONFIG_DEFAULTS,
  LIMITS: MAINTENANCE_CONFIG_LIMITS,
  PAGINATION: MAINTENANCE_CONFIG_PAGINATION,
});

export default MAINTENANCE_CONFIG_CONSTANTS;
