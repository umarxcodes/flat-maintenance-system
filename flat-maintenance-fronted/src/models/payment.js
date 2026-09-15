// =====================  PAYMENT DOMAIN MODEL  =================
/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} paymentNumber
 * @property {string} invoiceId
 * @property {string} buildingId
 * @property {string} flatId
 * @property {string} paidById
 * @property {number} amount
 * @property {'CASH'|'BANK_TRANSFER'|'CREDIT_CARD'|'DEBIT_CARD'|'UPI'|'CHEQUE'|'ONLINE'} paymentMethod
 * @property {string} [transactionReference]
 * @property {string} [receiptNumber]
 * @property {'SUCCESS'|'PENDING'|'FAILED'} status
 * @property {string} paymentDate
 * @property {string} [createdAt]
 */

export const PAYMENT_METHODS = Object.freeze({
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  UPI: "UPI",
  CHEQUE: "CHEQUE",
  ONLINE: "ONLINE",
});

export const PAYMENT_STATUS = Object.freeze({
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
});
