// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative Constants, Enums, and Boundaries for Module 15: Payments & ACID Financial Transactions (payments).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 45 and Section 23.
 */

// =====================  PAYMENT METHODS  ===================
export const PAYMENT_METHODS = Object.freeze({
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  UPI: "UPI",
  CHEQUE: "CHEQUE",
});

// =====================  TRANSACTIONAL OUTBOX EVENTS  ========
export const PAYMENT_OUTBOX_EVENTS = Object.freeze({
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
});

// =====================  PAGINATION & QUERY LIMITS  =========
export const PAYMENT_LIMITS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
