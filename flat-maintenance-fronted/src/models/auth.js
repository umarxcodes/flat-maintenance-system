// =====================  AUTH DOMAIN MODEL  ====================
/**
 * @typedef {Object} UserSession
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} role
 * @property {string[]} [permissions]
 * @property {string[]} [buildingIds]
 * @property {string} [token]
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

export const AUTH_EVENTS = Object.freeze({
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  SESSION_REFRESHED: "SESSION_REFRESHED",
});
