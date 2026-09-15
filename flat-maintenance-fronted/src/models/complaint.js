// =====================  COMPLAINT DOMAIN MODEL  ===============
/**
 * @typedef {Object} Complaint
 * @property {string} id
 * @property {string} complaintNumber
 * @property {string} title
 * @property {string} description
 * @property {string} buildingId
 * @property {string} [flatId]
 * @property {string} createdById
 * @property {'NOISE'|'PARKING'|'CLEANLINESS'|'SECURITY'|'HARASSMENT'|'MAINTENANCE'|'OTHER'} type
 * @property {'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'} priority
 * @property {'OPEN'|'UNDER_INVESTIGATION'|'RESOLVED'|'REJECTED'} status
 * @property {string} [resolvedById]
 * @property {string} [resolutionNotes]
 * @property {string} [resolvedAt]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const COMPLAINT_STATUS = Object.freeze({
  OPEN: "OPEN",
  UNDER_INVESTIGATION: "UNDER_INVESTIGATION",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
});

export const COMPLAINT_TYPES = Object.freeze({
  NOISE: "NOISE",
  PARKING: "PARKING",
  CLEANLINESS: "CLEANLINESS",
  SECURITY: "SECURITY",
  HARASSMENT: "HARASSMENT",
  MAINTENANCE: "MAINTENANCE",
  OTHER: "OTHER",
});
