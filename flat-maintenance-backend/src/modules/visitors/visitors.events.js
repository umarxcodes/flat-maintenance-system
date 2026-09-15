// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";
import { VISITOR_SECURITY_EVENTS } from "./visitors.constants.js";

// =====================  VISITOR EVENTS  ====================
export { VISITOR_SECURITY_EVENTS };

// =====================  EVENT EMITTER  =====================
/**
 * Emits a visitor domain security audit event via structured logger.
 *
 * @param {string} event - Canonical event name from VISITOR_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitVisitorSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
