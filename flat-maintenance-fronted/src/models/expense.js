// =====================  EXPENSE DOMAIN MODEL  =================
/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} expenseNumber
 * @property {string} title
 * @property {string} description
 * @property {string} buildingId
 * @property {string} vendor
 * @property {'MAINTENANCE'|'UTILITIES'|'SECURITY'|'CLEANING'|'ADMINISTRATIVE'|'REPAIRS'|'CAPITAL'|'OTHER'} category
 * @property {number} amount
 * @property {string} expenseDate
 * @property {string} [receiptUrl]
 * @property {'PENDING_APPROVAL'|'APPROVED'|'REJECTED'|'PAID'} status
 * @property {string} createdById
 * @property {string} [approvedById]
 * @property {string} [rejectionReason]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const EXPENSE_STATUS = Object.freeze({
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
});

export const EXPENSE_CATEGORY = Object.freeze({
  MAINTENANCE: "MAINTENANCE",
  UTILITIES: "UTILITIES",
  SECURITY: "SECURITY",
  CLEANING: "CLEANING",
  ADMINISTRATIVE: "ADMINISTRATIVE",
  REPAIRS: "REPAIRS",
  CAPITAL: "CAPITAL",
  OTHER: "OTHER",
});
