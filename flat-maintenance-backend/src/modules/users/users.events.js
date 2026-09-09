// =====================  IMPORTS  ==========================
import { logger } from "../../utils/logger.util.js";

// =====================  SECURITY AUDIT EVENTS  ==============
/**
 * Security-relevant user lifecycle event constants.
 */
export const USER_SECURITY_EVENTS = Object.freeze({
  USER_INVITED: "USER_INVITED",
  USER_STATUS_UPDATED: "USER_STATUS_UPDATED",
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  USER_DELETED: "USER_DELETED",
});

// =====================  EVENT EMITTER  =====================
/**
 * Emits a user lifecycle security audit event.
 *
 * Security Boundary:
 * Forwards structured telemetry to the system audit logger.
 * Never includes plaintext tokens, hashes, or passwords in event metadata.
 *
 * @param {string} event - Event name from USER_SECURITY_EVENTS.
 * @param {Object} metadata - Safe contextual metadata (actorId, userId, role, status).
 */
export const emitUserSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
