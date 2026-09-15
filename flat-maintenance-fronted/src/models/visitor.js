// =====================  VISITOR DOMAIN MODEL  =================
/**
 * @typedef {Object} Visitor
 * @property {string} id
 * @property {string} passCode
 * @property {string} visitorName
 * @property {string} [phone]
 * @property {string} buildingId
 * @property {string} flatId
 * @property {string} hostUserId
 * @property {'GUEST'|'DELIVERY'|'CAB'|'SERVICE_PROVIDER'|'OTHER'} visitorType
 * @property {string} expectedArrival
 * @property {string} [validUntil]
 * @property {string} [checkInTime]
 * @property {string} [checkOutTime]
 * @property {'EXPECTED'|'CHECKED_IN'|'CHECKED_OUT'|'EXPIRED'|'DENIED'} status
 * @property {string} [createdAt]
 */

export const VISITOR_STATUS = Object.freeze({
  EXPECTED: "EXPECTED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  EXPIRED: "EXPIRED",
  DENIED: "DENIED",
});

export const VISITOR_TYPE = Object.freeze({
  GUEST: "GUEST",
  DELIVERY: "DELIVERY",
  CAB: "CAB",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  OTHER: "OTHER",
});
