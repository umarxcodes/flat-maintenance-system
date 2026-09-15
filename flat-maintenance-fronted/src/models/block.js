// =====================  BLOCK DOMAIN MODEL  ===================
/**
 * @typedef {Object} Block
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} buildingId
 * @property {number} [totalFloors]
 * @property {number} [totalFlats]
 * @property {'ACTIVE'|'INACTIVE'} [status]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const BLOCK_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});
