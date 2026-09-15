// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";
import { DOCUMENT_SECURITY_EVENTS } from "./documents.constants.js";

// =====================  DOCUMENT EVENTS  ===================
export { DOCUMENT_SECURITY_EVENTS };

// =====================  EVENT EMITTER  =====================
/**
 * Emits a document repository domain security audit event via structured logger.
 *
 * @param {string} event - Canonical event name from DOCUMENT_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitDocumentSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
