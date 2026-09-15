// =====================  INVOICE DOMAIN MODEL  =================
/**
 * @typedef {Object} InvoiceLineItem
 * @property {string} description
 * @property {number} amount
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} invoiceNumber
 * @property {string} buildingId
 * @property {string} flatId
 * @property {string} [ownerId]
 * @property {string} [tenantId]
 * @property {string} billingPeriod
 * @property {number} subtotal
 * @property {number} [lateFee]
 * @property {number} totalAmount
 * @property {number} [paidAmount]
 * @property {number} dueAmount
 * @property {'DRAFT'|'ISSUED'|'PARTIALLY_PAID'|'PAID'|'OVERDUE'|'VOID'} status
 * @property {string} dueDate
 * @property {InvoiceLineItem[]} [lineItems]
 * @property {Object} [configurationSnapshot]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const INVOICE_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  VOID: "VOID",
});
