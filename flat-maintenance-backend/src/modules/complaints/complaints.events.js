// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";

// =====================  COMPLAINT SECURITY EVENTS  =========
export const COMPLAINT_SECURITY_EVENTS = Object.freeze({
  COMPLAINT_CREATED: "COMPLAINT_CREATED",
  COMPLAINT_INVESTIGATION_STARTED: "COMPLAINT_INVESTIGATION_STARTED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",
  COMPLAINT_REJECTED: "COMPLAINT_REJECTED",
});

// =====================  EVENT EMITTER  =====================
/**
 * Emits a complaint grievance domain security audit event.
 *
 * @param {string} event - Canonical event name from COMPLAINT_SECURITY_EVENTS.
 * @param {Object} metadata - Contextual audit parameters.
 */
export const emitComplaintSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
