// =====================  CONFIGURATION  =====================
/**
 * Building domain operational statuses.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35.
 */
export const BUILDING_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION",
});

// =====================  PAGINATION CONSTANTS  ==============
/**
 * Standard pagination defaults for building directory listings.
 */
export const BUILDINGS_CONSTANTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
