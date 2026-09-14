// =====================  PAYMENTS API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const paymentsApi = {
  getPayments: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.invoiceId) cleanParams.invoiceId = params.invoiceId;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.paymentMethod) cleanParams.paymentMethod = params.paymentMethod;
    if (params.transactionRef) cleanParams.transactionRef = params.transactionRef;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    return await apiClient.get(API_ENDPOINTS.PAYMENTS.BASE, { params: cleanParams });
  },

  getPaymentById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.PAYMENTS.BY_ID(id));
  },

  createPayment: async (data) => {
    return await apiClient.post(API_ENDPOINTS.PAYMENTS.BASE, data);
  },

  getPaymentReceipt: async (id) => {
    return await apiClient.get(API_ENDPOINTS.PAYMENTS.RECEIPT(id));
  },
};

export default paymentsApi;
