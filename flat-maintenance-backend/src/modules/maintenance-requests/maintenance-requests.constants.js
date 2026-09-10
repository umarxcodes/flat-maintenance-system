// =====================  STATUS ENUMS  ======================
/**
 * Canonical lifecycle status enums for Maintenance Requests / Work Orders.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 43.
 */
export const MAINTENANCE_REQUEST_STATUS = Object.freeze({
  OPEN: "OPEN",
  TRIAGED: "TRIAGED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

// =====================  CATEGORY ENUMS  ====================
/**
 * Maintenance trade and task categories.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 43.
 */
export const MAINTENANCE_REQUEST_CATEGORY = Object.freeze({
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  CARPENTRY: "CARPENTRY",
  HVAC: "HVAC",
  MASONRY: "MASONRY",
  CLEANING: "CLEANING",
  COMMON_AREA: "COMMON_AREA",
});

// =====================  PRIORITY ENUMS  ====================
/**
 * Operational priority levels.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 43.
 */
export const MAINTENANCE_REQUEST_PRIORITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  EMERGENCY: "EMERGENCY",
});

// =====================  SLA DURATION MATRIX  ===============
/**
 * Authoritative SLA resolution turnaround deadlines (in hours).
 * Evaluated relative to ticket creation or triage update.
 */
export const SLA_HOURS_BY_PRIORITY = Object.freeze({
  EMERGENCY: 4, // 4 hours
  HIGH: 24, // 1 day
  MEDIUM: 48, // 2 days
  LOW: 72, // 3 days
});

// =====================  VALIDATION BOUNDARIES  =============
export const MAINTENANCE_REQUEST_LIMITS = Object.freeze({
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 120,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 1000,
  MAX_INITIAL_PHOTOS: 5,
  MAX_COMPLETION_PHOTOS: 5,
});

// =====================  TRADE COMPATIBILITY MATRIX  =========
/**
 * Maps maintenance ticket category to eligible technician subcategories (trades).
 * Sourced from Section 10, 11, 41, and 43.
 */
export const TRADE_COMPATIBILITY_MAP = Object.freeze({
  PLUMBING: Object.freeze(["PLUMBER"]),
  ELECTRICAL: Object.freeze(["ELECTRICIAN"]),
  HVAC: Object.freeze(["HVAC_TECH"]),
  CARPENTRY: Object.freeze(["HANDYMAN"]),
  MASONRY: Object.freeze(["HANDYMAN"]),
  CLEANING: Object.freeze(["CLEANER"]),
  COMMON_AREA: Object.freeze([
    "HANDYMAN",
    "CLEANER",
    "PLUMBER",
    "ELECTRICIAN",
    "HVAC_TECH",
  ]),
});

// =====================  PAGINATION DEFAULTS  ===============
export const MAINTENANCE_REQUEST_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
});

// =====================  CANONICAL AGGREGATE  ===============
export const MAINTENANCE_REQUEST_CONSTANTS = Object.freeze({
  STATUS: MAINTENANCE_REQUEST_STATUS,
  CATEGORIES: MAINTENANCE_REQUEST_CATEGORY,
  PRIORITIES: MAINTENANCE_REQUEST_PRIORITY,
  SLA_HOURS: SLA_HOURS_BY_PRIORITY,
  LIMITS: MAINTENANCE_REQUEST_LIMITS,
  TRADE_COMPATIBILITY: TRADE_COMPATIBILITY_MAP,
  PAGINATION: MAINTENANCE_REQUEST_PAGINATION,
});

export default MAINTENANCE_REQUEST_CONSTANTS;
