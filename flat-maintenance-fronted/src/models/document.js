// =====================  DOCUMENT DOMAIN MODEL  ================
/**
 * @typedef {Object} Document
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {'LEASE_AGREEMENT'|'ID_PROOF'|'RECEIPT'|'INVOICE'|'SOCIETY_RULE'|'MAINTENANCE_RECORD'|'AUDIT_REPORT'|'OTHER'} documentType
 * @property {string} buildingId
 * @property {string} [flatId]
 * @property {string} fileUrl
 * @property {string} [fileName]
 * @property {number} [fileSizeBytes]
 * @property {string} [mimeType]
 * @property {'PUBLIC_ALL_RESIDENTS'|'OWNERS_ONLY'|'ADMIN_ONLY'|'FLAT_SPECIFIC'} visibility
 * @property {string} uploadedById
 * @property {string} [createdAt]
 */

export const DOCUMENT_VISIBILITY = Object.freeze({
  PUBLIC_ALL_RESIDENTS: "PUBLIC_ALL_RESIDENTS",
  OWNERS_ONLY: "OWNERS_ONLY",
  ADMIN_ONLY: "ADMIN_ONLY",
  FLAT_SPECIFIC: "FLAT_SPECIFIC",
});

export const DOCUMENT_TYPES = Object.freeze({
  LEASE_AGREEMENT: "LEASE_AGREEMENT",
  ID_PROOF: "ID_PROOF",
  RECEIPT: "RECEIPT",
  INVOICE: "INVOICE",
  SOCIETY_RULE: "SOCIETY_RULE",
  MAINTENANCE_RECORD: "MAINTENANCE_RECORD",
  AUDIT_REPORT: "AUDIT_REPORT",
  OTHER: "OTHER",
});
