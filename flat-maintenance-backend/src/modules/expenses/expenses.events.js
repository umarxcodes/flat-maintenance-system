// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";

// =====================  EXPENSE SECURITY EVENTS  ===========
/**
 * Canonical society expense domain security audit events.
 */
export const EXPENSE_SECURITY_EVENTS = Object.freeze({
  EXPENSE_CREATED: "EXPENSE_CREATED",
  EXPENSE_APPROVED: "EXPENSE_APPROVED",
});

// =====================  EVENT EMITTER  =====================
/**
 * Emits an expense domain security audit event via structured logger.
 *
 * @param {string} event - Canonical event name from EXPENSE_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitExpenseSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
