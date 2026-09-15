// =====================  PAYMENTS SERVICE  =======================
import { paymentsApi } from "../features/payments/api/payments.api.js";

/**
 * Service for payment recording, digital receipts, and ledger transactions.
 */
export const paymentsService = {
  getPayments: (params) => paymentsApi.getPayments(params),
  getPaymentById: (id) => paymentsApi.getPaymentById(id),
  recordPayment: (payload) => paymentsApi.recordPayment(payload),
};

export default paymentsService;
