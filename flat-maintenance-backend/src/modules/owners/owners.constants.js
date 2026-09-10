// =====================  CANONICAL CONSTANTS  =============
/**
 * Authoritative constants and boundaries for Module 9: Owners (owners).
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 39.
 */
export const OWNERS_CONSTANTS = Object.freeze({
  // Allowed Government ID Proof Types
  ID_PROOF_TYPES: Object.freeze({
    PASSPORT: "PASSPORT",
    NATIONAL_ID: "NATIONAL_ID",
    DRIVING_LICENSE: "DRIVING_LICENSE",
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
