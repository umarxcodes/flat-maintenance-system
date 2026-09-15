// =====================  BUILDING DOMAIN MODEL  ================
/**
 * @typedef {Object} Building
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} address
 * @property {number} [totalBlocks]
 * @property {number} [totalFloors]
 * @property {number} [totalFlats]
 * @property {'ACTIVE'|'INACTIVE'|'UNDER_CONSTRUCTION'} status
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const BUILDING_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION",
});
