// =====================  AUDIT LOG DOMAIN MODEL  ===============
/**
 * @typedef {Object} AuditLog
 * @property {string} id
 * @property {string} action
 * @property {string} actorUserId
 * @property {string} [actorRole]
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} [buildingId]
 * @property {string} timestamp
 * @property {string} [ipAddress]
 * @property {string} [userAgent]
 * @property {string} [correlationId]
 * @property {Object} [beforeState]
 * @property {Object} [afterState]
 */

export const AUDIT_LOG_RESOURCE_TYPES = Object.freeze({
  USER: "USER",
  ROLE: "ROLE",
  BUILDING: "BUILDING",
  BLOCK: "BLOCK",
  FLOOR: "FLOOR",
  FLAT: "FLAT",
  OWNER: "OWNER",
  TENANT: "TENANT",
  STAFF: "STAFF",
  MAINTENANCE_CONFIG: "MAINTENANCE_CONFIG",
  MAINTENANCE_REQUEST: "MAINTENANCE_REQUEST",
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  COMPLAINT: "COMPLAINT",
  REVIEW: "REVIEW",
  NOTICE: "NOTICE",
  NOTIFICATION: "NOTIFICATION",
  EXPENSE: "EXPENSE",
  VISITOR: "VISITOR",
  DOCUMENT: "DOCUMENT",
});
