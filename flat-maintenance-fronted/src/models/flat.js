// =====================  FLAT DOMAIN MODEL  ====================
/**
 * @typedef {Object} Flat
 * @property {string} id
 * @property {string} flatNumber
 * @property {string} buildingId
 * @property {string} blockId
 * @property {string} floorId
 * @property {number} [areaSqFt]
 * @property {'1BHK'|'2BHK'|'3BHK'|'4BHK'|'STUDIO'|'PENTHOUSE'|'COMMERCIAL'} [flatType]
 * @property {'VACANT'|'OCCUPIED'|'UNDER_MAINTENANCE'|'INACTIVE'} status
 * @property {string} [ownerId]
 * @property {string} [tenantId]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const FLAT_STATUS = Object.freeze({
  VACANT: "VACANT",
  OCCUPIED: "OCCUPIED",
  UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
  INACTIVE: "INACTIVE",
});

export const FLAT_TYPES = Object.freeze({
  STUDIO: "STUDIO",
  "1BHK": "1BHK",
  "2BHK": "2BHK",
  "3BHK": "3BHK",
  "4BHK": "4BHK",
  PENTHOUSE: "PENTHOUSE",
  COMMERCIAL: "COMMERCIAL",
});
