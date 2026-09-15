// =====================  ROLE DOMAIN MODEL  ====================
/**
 * @typedef {Object} Role
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} isSystemRole
 * @property {string[]} permissions
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const SYSTEM_ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDING_ADMIN: "BUILDING_ADMIN",
  MANAGER: "MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  MAINTENANCE_STAFF: "MAINTENANCE_STAFF",
  SECURITY_STAFF: "SECURITY_STAFF",
  OWNER: "OWNER",
  TENANT: "TENANT",
});

export const PRIVILEGED_ROLES = Object.freeze([
  SYSTEM_ROLES.SUPER_ADMIN,
  SYSTEM_ROLES.BUILDING_ADMIN,
  SYSTEM_ROLES.MANAGER,
  SYSTEM_ROLES.ACCOUNTANT,
  SYSTEM_ROLES.MAINTENANCE_STAFF,
  SYSTEM_ROLES.SECURITY_STAFF,
]);
