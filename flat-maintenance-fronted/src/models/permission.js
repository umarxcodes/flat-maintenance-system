// =====================  PERMISSION DOMAIN MODEL  ==============
/**
 * @typedef {Object} Permission
 * @property {string} id
 * @property {string} code
 * @property {string} module
 * @property {string} description
 * @property {string} [createdAt]
 */

export const PERMISSION_MODULES = Object.freeze({
  USERS: "USERS",
  ROLES: "ROLES",
  BUILDINGS: "BUILDINGS",
  BLOCKS: "BLOCKS",
  FLOORS: "FLOORS",
  FLATS: "FLATS",
  OWNERS: "OWNERS",
  TENANTS: "TENANTS",
  STAFF: "STAFF",
  MAINTENANCE_CONFIG: "MAINTENANCE_CONFIG",
  MAINTENANCE_REQUESTS: "MAINTENANCE_REQUESTS",
  INVOICES: "INVOICES",
  PAYMENTS: "PAYMENTS",
  COMPLAINTS: "COMPLAINTS",
  REVIEWS: "REVIEWS",
  NOTICES: "NOTICES",
  NOTIFICATIONS: "NOTIFICATIONS",
  EXPENSES: "EXPENSES",
  VISITORS: "VISITORS",
  DOCUMENTS: "DOCUMENTS",
  REPORTS: "REPORTS",
  AUDIT_LOGS: "AUDIT_LOGS",
});
