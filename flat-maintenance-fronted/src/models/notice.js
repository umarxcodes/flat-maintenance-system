// =====================  NOTICE DOMAIN MODEL  ==================
/**
 * @typedef {Object} Notice
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} buildingId
 * @property {string} [blockId]
 * @property {string} authorId
 * @property {'GENERAL'|'MAINTENANCE'|'EVENT'|'EMERGENCY'|'RULE'|'MEETING'} category
 * @property {'NORMAL'|'HIGH'|'URGENT_EMERGENCY'} priority
 * @property {'ALL_RESIDENTS'|'OWNERS_ONLY'|'TENANTS_ONLY'} targetAudience
 * @property {string[]} [attachments]
 * @property {string} publishedDate
 * @property {string} [expiryDate]
 * @property {boolean} isPinned
 * @property {string} [createdAt]
 */

export const NOTICE_PRIORITY = Object.freeze({
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT_EMERGENCY: "URGENT_EMERGENCY",
});

export const NOTICE_CATEGORY = Object.freeze({
  GENERAL: "GENERAL",
  MAINTENANCE: "MAINTENANCE",
  EVENT: "EVENT",
  EMERGENCY: "EMERGENCY",
  RULE: "RULE",
  MEETING: "MEETING",
});

export const NOTICE_AUDIENCE = Object.freeze({
  ALL_RESIDENTS: "ALL_RESIDENTS",
  OWNERS_ONLY: "OWNERS_ONLY",
  TENANTS_ONLY: "TENANTS_ONLY",
});
