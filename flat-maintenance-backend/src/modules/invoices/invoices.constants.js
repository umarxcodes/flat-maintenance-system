// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative Constants, Enums, and Boundaries for Module 14: Invoices (invoices).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 44 and Section 23.
 */

// =====================  INVOICE STATUS LIFECYCLE  ==========
export const INVOICE_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  VOID: "VOID",
});

// =====================  PAYABLE INVOICE STATUSES  ==========
/**
 * Statuses under which an invoice can accept financial payments.
 * Sourced from Section 23 Multi-Document ACID Payment Contract.
 */
export const PAYABLE_INVOICE_STATUSES = Object.freeze([
  INVOICE_STATUS.ISSUED,
  INVOICE_STATUS.PARTIALLY_PAID,
  INVOICE_STATUS.OVERDUE,
]);

// =====================  BILLING PERIOD PATTERNS  ===========
/**
 * Canonical ISO billing period format regex: YYYY-MM (e.g. 2026-09)
 */
export const BILLING_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

// =====================  PAGINATION & LIMITS  ===============
export const INVOICES_PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

export const INVOICE_LIMITS = Object.freeze({
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 100000000, // 100 million maximum ceiling
  DEFAULT_PAID_AMOUNT: 0,
  DEFAULT_LATE_FEE: 0,
  BATCH_STREAM_SIZE: 100,
  MAX_RETRY_ATTEMPTS: 5,
});

// =====================  AGGREGATE CONSTANTS OBJECT  ========
export const INVOICES_CONSTANTS = Object.freeze({
  STATUS: INVOICE_STATUS,
  PAYABLE_STATUSES: PAYABLE_INVOICE_STATUSES,
  PERIOD_REGEX: BILLING_PERIOD_REGEX,
  PAGINATION: INVOICES_PAGINATION,
  LIMITS: INVOICE_LIMITS,
});

export default INVOICES_CONSTANTS;
