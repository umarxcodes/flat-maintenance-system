// =====================  REVIEW DOMAIN MODEL  ==================
/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} staffId
 * @property {string} [maintenanceRequestId]
 * @property {string} reviewerId
 * @property {number} rating
 * @property {string} [title]
 * @property {string} [comment]
 * @property {'PUBLISHED'|'FLAGGED'|'HIDDEN'} status
 * @property {string} [createdAt]
 */

export const REVIEW_STATUS = Object.freeze({
  PUBLISHED: "PUBLISHED",
  FLAGGED: "FLAGGED",
  HIDDEN: "HIDDEN",
});
