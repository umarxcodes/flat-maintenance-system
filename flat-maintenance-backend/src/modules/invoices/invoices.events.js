// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";

// =====================  INVOICE SECURITY EVENTS  ===========
export const INVOICE_SECURITY_EVENTS = Object.freeze({
  INVOICE_BATCH_GENERATED: "INVOICE_BATCH_GENERATED",
  INVOICE_VOIDED: "INVOICE_VOIDED",
  INVOICE_PUBLISHED: "INVOICE_PUBLISHED",
});

// =====================  EVENT EMITTER  =====================
/**
 * Emits an invoice domain security audit event.
 *
 * @param {string} event - Canonical event name from INVOICE_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitInvoiceSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
