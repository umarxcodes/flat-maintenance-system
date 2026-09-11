// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";

// =====================  NOTICE SECURITY EVENTS  ============
/**
 * Canonical notice domain security audit events.
 */
export const NOTICE_SECURITY_EVENTS = Object.freeze({
  NOTICE_PUBLISHED: "NOTICE_PUBLISHED",
  NOTICE_RETRACTED: "NOTICE_RETRACTED",
});

// =====================  EVENT EMITTER  =====================
/**
 * Emits a notice domain security audit event via structured logger.
 *
 * @param {string} event - Canonical event name from NOTICE_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitNoticeSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
