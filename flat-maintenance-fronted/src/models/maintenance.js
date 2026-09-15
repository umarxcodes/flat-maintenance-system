// =====================  MAINTENANCE DOMAIN MODEL  =============
/**
 * @typedef {Object} MaintenanceConfiguration
 * @property {string} id
 * @property {string} buildingId
 * @property {'FIXED_PER_FLAT'|'PER_SQ_FT'|'HYBRID'} chargeType
 * @property {number} baseRate
 * @property {number} [parkingCharge]
 * @property {number} [waterCharge]
 * @property {number} [sinkingFund]
 * @property {number} lateFeePercentage
 * @property {number} gracePeriodDays
 * @property {string} effectiveFrom
 * @property {boolean} isActive
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} MaintenanceRequest
 * @property {string} id
 * @property {string} requestNumber
 * @property {string} title
 * @property {string} description
 * @property {string} buildingId
 * @property {string} flatId
 * @property {string} requestedById
 * @property {string} [assignedStaffId]
 * @property {'PLUMBING'|'ELECTRICAL'|'CARPENTRY'|'PAINTING'|'HVAC'|'GENERAL'|'SECURITY'} category
 * @property {'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'} priority
 * @property {'OPEN'|'TRIAGED'|'ASSIGNED'|'IN_PROGRESS'|'COMPLETED'|'VERIFIED'|'CLOSED'|'CANCELLED'} status
 * @property {string} [slaDeadline]
 * @property {string[]} [initialPhotos]
 * @property {string[]} [completionPhotos]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const MAINTENANCE_REQUEST_STATUS = Object.freeze({
  OPEN: "OPEN",
  TRIAGED: "TRIAGED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

export const MAINTENANCE_PRIORITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  EMERGENCY: "EMERGENCY",
});

export const CHARGE_TYPE = Object.freeze({
  FIXED_PER_FLAT: "FIXED_PER_FLAT",
  PER_SQ_FT: "PER_SQ_FT",
  HYBRID: "HYBRID",
});
