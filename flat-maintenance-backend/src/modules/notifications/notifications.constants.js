// =====================  NOTIFICATION CATEGORIES  ==========
/**
 * Canonical notification category classification.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 49.
 */
export const NOTIFICATION_CATEGORY = Object.freeze({
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  WORK_ORDER: "WORK_ORDER",
  COMPLAINT: "COMPLAINT",
  VISITOR: "VISITOR",
  NOTICE: "NOTICE",
  SECURITY: "SECURITY",
});

// =====================  PAYLOAD BOUNDARIES  ===============
/**
 * Strict length and bounding limits for notification payloads.
 */
export const NOTIFICATION_LIMITS = Object.freeze({
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 160,
  BODY_MIN_LENGTH: 1,
  BODY_MAX_LENGTH: 2000,
});

// =====================  PAGINATION DEFAULTS  ==============
/**
 * Standard pagination defaults and safety limits for notifications feed.
 */
export const NOTIFICATION_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// =====================  RETENTION POLICY  =================
/**
 * MongoDB TTL index duration (90 days in seconds).
 * 90 days * 24 hours * 60 minutes * 60 seconds = 7,776,000 seconds.
 */
export const NOTIFICATION_TTL_SECONDS = 90 * 24 * 60 * 60;
