// =====================  VISITOR TYPES  =====================
/**
 * Canonical visitor classification types recognized at the physical gate.
 */
export const VISITOR_TYPES = Object.freeze({
  GUEST: "GUEST",
  DELIVERY: "DELIVERY",
  CAB: "CAB",
  SERVICE_TECHNICIAN: "SERVICE_TECHNICIAN",
  OTHER: "OTHER",
});

// =====================  VISITOR STATUSES  ==================
/**
 * Canonical physical gate access lifecycle statuses.
 */
export const VISITOR_STATUS = Object.freeze({
  EXPECTED: "EXPECTED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  EXPIRED: "EXPIRED",
  DENIED: "DENIED",
});

// =====================  VISITOR CONSTRAINTS  ===============
/**
 * Field length boundaries and cryptographic constraints.
 */
export const VISITOR_CONSTRAINTS = Object.freeze({
  PASSCODE_LENGTH: 6,
  PASSCODE_REGEX: /^\d{6}$/,
  EXPIRATION_HOURS: 24,
  EXPIRATION_MS: 24 * 60 * 60 * 1000,
  DEFAULT_VISITOR_COUNT: 1,
  MIN_VISITOR_COUNT: 1,
  MAX_VISITOR_COUNT: 50,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_PHONE_LENGTH: 20,
  MAX_VEHICLE_LENGTH: 20,
});

// =====================  STATUS TRANSITIONS  ================
/**
 * Strict finite state machine transition matrix for physical gate passes.
 */
export const VISITOR_TRANSITIONS = Object.freeze({
  [VISITOR_STATUS.EXPECTED]: Object.freeze([
    VISITOR_STATUS.CHECKED_IN,
    VISITOR_STATUS.EXPIRED,
    VISITOR_STATUS.DENIED,
  ]),
  [VISITOR_STATUS.CHECKED_IN]: Object.freeze([VISITOR_STATUS.CHECKED_OUT]),
  [VISITOR_STATUS.CHECKED_OUT]: Object.freeze([]),
  [VISITOR_STATUS.EXPIRED]: Object.freeze([]),
  [VISITOR_STATUS.DENIED]: Object.freeze([]),
});

// =====================  SECURITY EVENTS  ===================
/**
 * Telemetry and audit events for visitor gate operations.
 */
export const VISITOR_SECURITY_EVENTS = Object.freeze({
  VISITOR_PASS_CREATED: "VISITOR_PASS_CREATED",
  VISITOR_VERIFIED: "VISITOR_VERIFIED",
  VISITOR_CHECKED_IN: "VISITOR_CHECKED_IN",
  VISITOR_CHECKED_OUT: "VISITOR_CHECKED_OUT",
  VISITOR_PASS_SHARED: "VISITOR_PASS_SHARED",
});
