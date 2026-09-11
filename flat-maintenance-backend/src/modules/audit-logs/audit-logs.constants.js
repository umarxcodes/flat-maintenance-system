// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative Constants, Enums, and Limits for Module 24: Audit Logs & Append-Only Event Trail (audit-logs).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 54, Section 63, and ADR-012.
 */

// =====================  AUDIT ACTIONS  =====================
/**
 * Canonical taxonomy for sensitive security, financial, role, and operational domain mutations.
 */
export const AUDIT_ACTIONS = Object.freeze({
  // User & Identity Lifecycle
  USER_INVITED: "USER_INVITED",
  USER_STATUS_UPDATED: "USER_STATUS_UPDATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_BUILDING_SCOPE_CHANGED: "USER_BUILDING_SCOPE_CHANGED",

  // Financial Lifecycle
  INVOICE_GENERATED: "INVOICE_GENERATED",
  INVOICE_VOIDED: "INVOICE_VOIDED",
  PAYMENT_RECORDED: "PAYMENT_RECORDED",
  EXPENSE_CREATED: "EXPENSE_CREATED",
  EXPENSE_APPROVED: "EXPENSE_APPROVED",
  EXPENSE_REJECTED: "EXPENSE_REJECTED",
  BILLING_CONFIG_ACTIVATED: "BILLING_CONFIG_ACTIVATED",

  // Occupancy & Property Lifecycle
  FLAT_OCCUPANCY_CHANGED: "FLAT_OCCUPANCY_CHANGED",
  TENANT_LEASE_ACTIVATED: "TENANT_LEASE_ACTIVATED",
  TENANT_MOVED_OUT: "TENANT_MOVED_OUT",

  // Operational & Work Orders
  MAINTENANCE_REQUEST_ASSIGNED: "MAINTENANCE_REQUEST_ASSIGNED",
  MAINTENANCE_REQUEST_COMPLETED: "MAINTENANCE_REQUEST_COMPLETED",
  COMPLAINT_TRIAGED: "COMPLAINT_TRIAGED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",

  // Security & Document Repository
  VISITOR_PASS_GENERATED: "VISITOR_PASS_GENERATED",
  VISITOR_CHECKED_IN: "VISITOR_CHECKED_IN",
  VISITOR_CHECKED_OUT: "VISITOR_CHECKED_OUT",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
});

// =====================  RESOURCE TYPES  ====================
/**
 * Stable domain entity classifiers for forensic audit referencing.
 */
export const AUDIT_RESOURCE_TYPES = Object.freeze({
  USER: "USER",
  ROLE: "ROLE",
  BUILDING: "BUILDING",
  BLOCK: "BLOCK",
  FLOOR: "FLOOR",
  FLAT: "FLAT",
  OWNER: "OWNER",
  TENANT: "TENANT",
  STAFF: "STAFF",
  MAINTENANCE_CONFIG: "MAINTENANCE_CONFIG",
  MAINTENANCE_REQUEST: "MAINTENANCE_REQUEST",
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  COMPLAINT: "COMPLAINT",
  REVIEW: "REVIEW",
  NOTICE: "NOTICE",
  NOTIFICATION: "NOTIFICATION",
  EXPENSE: "EXPENSE",
  VISITOR: "VISITOR",
  DOCUMENT: "DOCUMENT",
});

// =====================  PAGINATION & QUERY LIMITS  =========
export const AUDIT_LOG_LIMITS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// =====================  SECURITY AUDIT EVENTS  =============
export const AUDIT_SECURITY_EVENTS = Object.freeze({
  AUDIT_LOGS_ACCESSED: "AUDIT_LOGS_ACCESSED",
  AUDIT_MUTATION_ATTEMPT_BLOCKED: "AUDIT_MUTATION_ATTEMPT_BLOCKED",
  AUDIT_APPEND_FAILED: "AUDIT_APPEND_FAILED",
});

// =====================  SNAPSHOT REDACTION KEYS  ===========
/**
 * Sensitive credential, token, and secret keys that MUST be redacted
 * from beforeState and afterState forensic snapshots prior to persistence.
 */
export const SENSITIVE_SECRET_KEYS = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "tokenhash",
  "invitationtoken",
  "invitationtokenhash",
  "resettoken",
  "passwordresettokenhash",
  "apikey",
  "apisecret",
  "secret",
  "webhooksecret",
  "cookie",
  "authorization",
  "authorizationcode",
]);
