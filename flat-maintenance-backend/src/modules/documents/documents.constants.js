// =====================  DOCUMENT TYPES  ====================
/**
 * Canonical classification types for society documents and legal records.
 */
export const DOCUMENT_TYPES = Object.freeze({
  SOCIETY_BYLAW: "SOCIETY_BYLAW",
  AGM_MINUTES: "AGM_MINUTES",
  FLAT_DEED: "FLAT_DEED",
  LEASE_CONTRACT: "LEASE_CONTRACT",
  INSURANCE_POLICY: "INSURANCE_POLICY",
  AUDIT_REPORT: "AUDIT_REPORT",
  OTHER: "OTHER",
});

// =====================  DOCUMENT VISIBILITY  ===============
/**
 * Strict role-based and flat-scoped visibility classification.
 */
export const DOCUMENT_VISIBILITY = Object.freeze({
  PUBLIC_ALL_RESIDENTS: "PUBLIC_ALL_RESIDENTS",
  OWNERS_ONLY: "OWNERS_ONLY",
  ADMIN_ONLY: "ADMIN_ONLY",
  FLAT_SPECIFIC: "FLAT_SPECIFIC",
});

// =====================  DOCUMENT CONSTRAINTS  ==============
/**
 * Validation boundaries and file-size constraints.
 */
export const DOCUMENT_CONSTRAINTS = Object.freeze({
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 150,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
});

// =====================  ALLOWED MIME TYPES  ================
/**
 * Whitelist of acceptable MIME types for in-memory upload streaming.
 */
export const DOCUMENT_ALLOWED_MIME_TYPES = Object.freeze([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// =====================  SECURITY EVENTS  ===================
/**
 * Telemetry and audit events for document repository operations.
 */
export const DOCUMENT_SECURITY_EVENTS = Object.freeze({
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_READ_LIST: "DOCUMENT_READ_LIST",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
});
