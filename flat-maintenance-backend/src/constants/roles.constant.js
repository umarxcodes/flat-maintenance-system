// =====================  SYSTEM ROLES  ======================
/**
 * Canonical 6-tier operational roles + resident personas.
 *
 * Invariant:
 * These roles match the documented hierarchy in BACKEND_TECHNICAL_DOCUMENTATION.md.
 * Roles dictate platform authorization boundaries and object-level building scopes.
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

// =====================  PRIVILEGED ROLES  ==================
/**
 * Roles classified as privileged administrative personnel.
 * Invariant: Privileged roles are prohibited from public self-registration.
 */
export const PRIVILEGED_ROLES = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.BUILDING_ADMIN,
  ROLES.MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.MAINTENANCE_STAFF,
  ROLES.SECURITY_STAFF,
]);
