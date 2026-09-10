// =====================  IMPORTS & CONSTANTS  ================
/**
 * Floors domain constants and validation constraints.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 37.
 */
export const FLOORS_CONSTANTS = Object.freeze({
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 64,
  MIN_FLOOR_NUMBER: -10, // Supports up to 10 basement parking/storage levels
  MAX_FLOOR_NUMBER: 200, // Supports super-tall residential towers
});
