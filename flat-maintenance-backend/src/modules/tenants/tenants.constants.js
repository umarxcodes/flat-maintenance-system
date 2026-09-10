// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative constants and boundaries for Module 10: Tenants (tenants).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 40.
 */
export const TENANTS_CONSTANTS = Object.freeze({
  // Police Verification Status Lifecycle
  POLICE_VERIFICATION_STATUS: Object.freeze({
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  }),

  // Tenant Occupancy Lifecycle Statuses
  TENANT_STATUS: Object.freeze({
    ACTIVE: "ACTIVE",
    MOVED_OUT: "MOVED_OUT",
    TERMINATED: "TERMINATED",
  }),

  // Emergency Contact Validation Boundaries
  EMERGENCY_CONTACT: Object.freeze({
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 64,
    RELATIONSHIP_MIN_LENGTH: 2,
    RELATIONSHIP_MAX_LENGTH: 32,
  }),

  // Pagination Boundaries
  PAGINATION: Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  }),
});
