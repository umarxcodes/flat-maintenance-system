// =====================  CANONICAL ROLES  =====================
/**
 * Canonical 8 system roles matching backend constants
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDING_ADMIN: "BUILDING_ADMIN",
  MANAGER: "MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  MAINTENANCE_STAFF: "MAINTENANCE_STAFF",
  SECURITY_STAFF: "SECURITY_STAFF",
  OWNER: "OWNER",
  TENANT: "TENANT",
});

/**
 * Human-friendly labels for UI presentation
 */
export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: "Super Administrator",
  [ROLES.BUILDING_ADMIN]: "Building Administrator",
  [ROLES.MANAGER]: "Society Manager",
  [ROLES.ACCOUNTANT]: "Accountant",
  [ROLES.MAINTENANCE_STAFF]: "Maintenance Staff",
  [ROLES.SECURITY_STAFF]: "Security Staff",
  [ROLES.OWNER]: "Flat Owner",
  [ROLES.TENANT]: "Tenant / Resident",
});
