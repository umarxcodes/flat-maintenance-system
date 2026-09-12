// =====================  PAYMENTS API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const paymentsApi = {
  getPayments: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.PAYMENTS.BASE, { params });
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
