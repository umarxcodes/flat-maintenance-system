// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative domain constants and boundaries for Module 18:
 * Society Notices & Announcements (notices).
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 48 & Section 25.
 */

// =====================  CATEGORY ENUMS  ====================
/**
 * Canonical notice bulletin categories.
 */
export const NOTICE_CATEGORY = Object.freeze({
  GENERAL: "GENERAL",
  MAINTENANCE: "MAINTENANCE",
  EMERGENCY: "EMERGENCY",
  EVENT: "EVENT",
  FINANCIAL: "FINANCIAL",
  SECURITY: "SECURITY",
});

// =====================  PRIORITY ENUMS  ====================
/**
 * Operational priority levels for notice broadcasts.
 */
export const NOTICE_PRIORITY = Object.freeze({
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT_EMERGENCY: "URGENT_EMERGENCY",
});

// =====================  AUDIENCE ENUMS  ====================
/**
 * Target audience segmentation for community bulletins.
 */
export const TARGET_AUDIENCE = Object.freeze({
  ALL: "ALL",
  OWNERS_ONLY: "OWNERS_ONLY",
  TENANTS_ONLY: "TENANTS_ONLY",
});

// =====================  VALIDATION BOUNDARIES  =============
/**
 * Field length limits and attachment constraints.
 */
export const NOTICE_LIMITS = Object.freeze({
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 160,
  CONTENT_MIN_LENGTH: 5,
  CONTENT_MAX_LENGTH: 5000,
  MAX_ATTACHMENT_URLS: 5,
});

// =====================  PAGINATION CONSTANTS  ==============
/**
 * Standard pagination defaults for notice queries.
 */
export const NOTICE_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
