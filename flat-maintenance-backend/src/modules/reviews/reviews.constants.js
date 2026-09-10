// =====================  CONSTANTS  =========================
/**
 * Authoritative constants and enums for Module 17: Ratings & Service Reviews (reviews).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 47.
 */
export const MODERATION_STATUS = Object.freeze({
  PUBLISHED: "PUBLISHED",
  FLAGGED: "FLAGGED",
  HIDDEN: "HIDDEN",
});

export const REVIEW_LIMITS = Object.freeze({
  RATING_MIN: 1,
  RATING_MAX: 5,
  TITLE_MAX_LENGTH: 120,
  COMMENT_MAX_LENGTH: 1000,
  MODERATION_REASON_MAX_LENGTH: 500,
});

export const REVIEW_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
});

export const REVIEWS_CONSTANTS = Object.freeze({
  MODERATION_STATUS,
  LIMITS: REVIEW_LIMITS,
  PAGINATION: REVIEW_PAGINATION,
});

export default REVIEWS_CONSTANTS;
