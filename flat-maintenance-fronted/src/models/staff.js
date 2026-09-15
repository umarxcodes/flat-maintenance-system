// =====================  STAFF DOMAIN MODEL  ===================
/**
 * @typedef {Object} Staff
 * @property {string} id
 * @property {string} userId
 * @property {string} buildingId
 * @property {'MAINTENANCE'|'SECURITY'|'CLEANING'|'ADMIN'|'ELECTRICAL'|'PLUMBING'|'HVAC'} category
 * @property {string} [designation]
 * @property {'MORNING'|'EVENING'|'NIGHT'|'ROTATIONAL'} [shift]
 * @property {number} [averageRating]
 * @property {number} [totalReviews]
 * @property {boolean} [isAvailable]
 * @property {'ACTIVE'|'ON_LEAVE'|'TERMINATED'} status
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const STAFF_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  ON_LEAVE: "ON_LEAVE",
  TERMINATED: "TERMINATED",
});

export const STAFF_CATEGORIES = Object.freeze({
  MAINTENANCE: "MAINTENANCE",
  SECURITY: "SECURITY",
  CLEANING: "CLEANING",
  ADMIN: "ADMIN",
  ELECTRICAL: "ELECTRICAL",
  PLUMBING: "PLUMBING",
  HVAC: "HVAC",
});
