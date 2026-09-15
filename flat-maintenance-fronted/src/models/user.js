// =====================  USER DOMAIN MODEL  ====================
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [phone]
 * @property {'SUPER_ADMIN'|'BUILDING_ADMIN'|'MANAGER'|'ACCOUNTANT'|'MAINTENANCE_STAFF'|'SECURITY_STAFF'|'OWNER'|'TENANT'} role
 * @property {'PENDING'|'ACTIVE'|'INACTIVE'|'SUSPENDED'} status
 * @property {string[]} [buildingIds]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const USER_STATUS = Object.freeze({
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
});
