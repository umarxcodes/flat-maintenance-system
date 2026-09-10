// =====================  IMPORTS  ==========================
import { ROLES } from "../../constants/roles.constant.js";

// =====================  STAFF CONSTANTS  ===================
/**
 * Canonical Staff Domain Enums, Mappings, and Validation Boundaries.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 41 (Module 11: Staff).
 * Governs on-site operational personnel, trade specializations, assigned shifts,
 * duty lifecycle statuses, and performance ratings.
 */
export const STAFF_CONSTANTS = Object.freeze({
  // Authoritative Staff Categories per Section 41.2
  CATEGORIES: Object.freeze({
    MAINTENANCE: "MAINTENANCE",
    SECURITY: "SECURITY",
    ADMINISTRATION: "ADMINISTRATION",
    CLEANING: "CLEANING",
  }),

  // Authoritative Staff SubCategories (Trade Specializations) per Section 41.2
  SUB_CATEGORIES: Object.freeze({
    PLUMBER: "PLUMBER",
    ELECTRICIAN: "ELECTRICIAN",
    HVAC_TECH: "HVAC_TECH",
    HANDYMAN: "HANDYMAN",
    GATE_GUARD: "GATE_GUARD",
    LOBBY_GUARD: "LOBBY_GUARD",
    CLEANER: "CLEANER",
  }),

  // Category ↔ SubCategory Compatibility Matrix
  // Sourced from Section 10, 11, and 41
  CATEGORY_SUBCATEGORY_MAP: Object.freeze({
    MAINTENANCE: Object.freeze([
      "PLUMBER",
      "ELECTRICIAN",
      "HVAC_TECH",
      "HANDYMAN",
    ]),
    SECURITY: Object.freeze(["GATE_GUARD", "LOBBY_GUARD"]),
    CLEANING: Object.freeze(["CLEANER"]),
    ADMINISTRATION: Object.freeze([]), // Relies on designation; no trade subcategories defined
  }),

  // Category to User Role Compatibility Mapping
  CATEGORY_ROLE_MAP: Object.freeze({
    SECURITY: ROLES.SECURITY_STAFF,
    MAINTENANCE: ROLES.MAINTENANCE_STAFF,
    CLEANING: ROLES.MAINTENANCE_STAFF,
    ADMINISTRATION: null, // Flexible operational administration
  }),

  // Authoritative Assigned Shifts per Section 41.2
  SHIFTS: Object.freeze({
    MORNING: "MORNING",
    EVENING: "EVENING",
    NIGHT: "NIGHT",
    ROTATIONAL: "ROTATIONAL",
  }),

  // Duty / Status Lifecycle per Section 41.2
  STATUS: Object.freeze({
    ACTIVE: "ACTIVE",
    ON_LEAVE: "ON_LEAVE",
    TERMINATED: "TERMINATED",
  }),

  // Designation String Boundaries
  DESIGNATION: Object.freeze({
    MIN_LENGTH: 2,
    MAX_LENGTH: 64,
  }),

  // Performance Rating Boundaries
  RATINGS: Object.freeze({
    MIN: 0.0,
    MAX: 5.0,
    DEFAULT_AVERAGE: 0.0,
    DEFAULT_COUNT: 0,
  }),

  // Pagination defaults
  PAGINATION: Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  }),
});

export default STAFF_CONSTANTS;
