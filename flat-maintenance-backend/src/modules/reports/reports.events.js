// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";
import { REPORT_SECURITY_EVENTS } from "./reports.constants.js";

// =====================  REPORT EVENTS  =====================
export { REPORT_SECURITY_EVENTS };

// =====================  EVENT EMITTER  =====================
/**
 * Emits a report analytics security audit event via structured logger.
 *
 * @param {string} event - Canonical event name from REPORT_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitReportSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
