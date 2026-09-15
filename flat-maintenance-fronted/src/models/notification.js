// =====================  NOTIFICATION DOMAIN MODEL  ============
/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} recipientUserId
 * @property {string} title
 * @property {string} body
 * @property {'INFO'|'WARNING'|'SUCCESS'|'DANGER'} [type]
 * @property {string} [resourceType]
 * @property {string} [resourceId]
 * @property {string} [actionUrl]
 * @property {boolean} isRead
 * @property {string} [readAt]
 * @property {string} [createdAt]
 */

export const NOTIFICATION_TYPE = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  DANGER: "DANGER",
});
