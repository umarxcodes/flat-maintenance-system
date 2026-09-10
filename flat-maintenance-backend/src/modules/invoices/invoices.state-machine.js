// =====================  IMPORTS  ==========================
import { INVOICE_STATUS } from "./invoices.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  STATE TRANSITION GRAPH  =============
/**
 * Canonical Maintenance Invoice State Transition Graph.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 70.5:
 *
 *   [*] --> DRAFT: Batch Run Generated
 *   DRAFT --> ISSUED: Published to Resident
 *   ISSUED --> PARTIALLY_PAID: Partial Payment Received
 *   PARTIALLY_PAID --> PAID: Balance Cleared
 *   ISSUED --> PAID: Full Payment Received
 *   ISSUED --> OVERDUE: Due Date Elapsed
 *   OVERDUE --> PAID: Arrears Cleared
 *   DRAFT --> VOID: Calculation Cancelled
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [INVOICE_STATUS.DRAFT]: Object.freeze([
    INVOICE_STATUS.ISSUED,
    INVOICE_STATUS.VOID,
  ]),
  [INVOICE_STATUS.ISSUED]: Object.freeze([
    INVOICE_STATUS.PARTIALLY_PAID,
    INVOICE_STATUS.PAID,
    INVOICE_STATUS.OVERDUE,
  ]),
  [INVOICE_STATUS.PARTIALLY_PAID]: Object.freeze([INVOICE_STATUS.PAID]),
  [INVOICE_STATUS.OVERDUE]: Object.freeze([INVOICE_STATUS.PAID]),
  [INVOICE_STATUS.PAID]: Object.freeze([]), // Terminal
  [INVOICE_STATUS.VOID]: Object.freeze([]), // Terminal
});

// =====================  STATE TRANSITION VALIDATOR  ========
/**
 * Pure state machine transition validator for invoice lifecycles.
 * Supports both object and positional parameter calling conventions.
 *
 * @param {Object|string} firstArg - Parameters object or currentStatus.
 * @param {string} [targetStatusArg] - Target status if positional.
 * @param {string} [actorRoleArg] - Actor role if positional.
 * @throws {ApiError} If transition is illegal or unauthorized.
 * @returns {boolean} True if transition is valid.
 */
export const validateInvoiceTransition = (
  firstArg,
  targetStatusArg,
  actorRoleArg
) => {
  let currentStatus;
  let targetStatus;
  let actorRole;

  if (typeof firstArg === "object" && firstArg !== null) {
    currentStatus = firstArg.currentStatus;
    targetStatus = firstArg.targetStatus;
    actorRole = firstArg.actorRole;
  } else {
    currentStatus = firstArg;
    targetStatus = targetStatusArg;
    actorRole = actorRoleArg;
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedTargets.includes(targetStatus)) {
    throw new ApiError(
      400,
      `Invalid invoice state transition: Cannot transition invoice from '${currentStatus}' to '${targetStatus}'`,
      [],
      ERROR_CODES.BAD_REQUEST
    );
  }

  // 1. VOID Authorization: Strictly restricted to Accountant / Administrator
  if (targetStatus === INVOICE_STATUS.VOID) {
    if (
      ![ROLES.ACCOUNTANT, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN].includes(
        actorRole
      )
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Only Accountants and Administrators can void draft maintenance invoices",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  // 2. ISSUED Publication Authorization: Strictly restricted to Accountant / Administrator
  if (targetStatus === INVOICE_STATUS.ISSUED) {
    if (
      ![ROLES.ACCOUNTANT, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN].includes(
        actorRole
      )
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Only Accountants and Administrators can publish draft maintenance invoices",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  return true;
};
