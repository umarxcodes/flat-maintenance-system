// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative Constants, Enums, and Boundaries for Module 16: Complaints & SLA Ticket Management.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 46, Section 70.4, and Section 14.
 */

// =====================  COMPLAINT TYPES  ===================
/**
 * Grievance classification categories strictly distinct from physical maintenance work orders.
 */
export const COMPLAINT_TYPE = Object.freeze({
  NOISE_DISTURBANCE: "NOISE_DISTURBANCE",
  PARKING_DISPUTE: "PARKING_DISPUTE",
  SECURITY_BREACH: "SECURITY_BREACH",
  SANITATION: "SANITATION",
  SOCIETY_RULE_VIOLATION: "SOCIETY_RULE_VIOLATION",
  OTHER: "OTHER",
});

// =====================  COMPLAINT STATUS LIFECYCLE  ========
/**
 * 4-Stage Grievance Lifecycle States.
 */
export const COMPLAINT_STATUS = Object.freeze({
  OPEN: "OPEN",
  UNDER_INVESTIGATION: "UNDER_INVESTIGATION",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
});

// =====================  TERMINAL STATUSES  =================
export const TERMINAL_COMPLAINT_STATUSES = Object.freeze([
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.REJECTED,
]);

// =====================  LIMITS & BOUNDARIES  ===============
export const COMPLAINT_LIMITS = Object.freeze({
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 2000,
  RESOLUTION_NOTES_MIN_LENGTH: 5,
  RESOLUTION_NOTES_MAX_LENGTH: 2000,
  MAX_RETRY_ATTEMPTS: 10,
});

// =====================  PAGINATION CONSTANTS  ==============
export const COMPLAINTS_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// =====================  AGGREGATE CONSTANTS OBJECT  ========
export const COMPLAINTS_CONSTANTS = Object.freeze({
  TYPE: COMPLAINT_TYPE,
  STATUS: COMPLAINT_STATUS,
  TERMINAL_STATUSES: TERMINAL_COMPLAINT_STATUSES,
  LIMITS: COMPLAINT_LIMITS,
  PAGINATION: COMPLAINTS_PAGINATION,
});

export default COMPLAINTS_CONSTANTS;
