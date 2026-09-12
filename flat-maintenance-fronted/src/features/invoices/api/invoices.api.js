// =====================  INVOICES API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const invoicesApi = {
  getInvoices: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.INVOICES.BASE, { params });
  },

  getInvoiceById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.INVOICES.BY_ID(id));
  },

  generateBatch: async (data) => {
    return await apiClient.post(API_ENDPOINTS.INVOICES.GENERATE_BATCH, data);
  },

  voidInvoice: async (id) => {
    return await apiClient.patch(API_ENDPOINTS.INVOICES.VOID(id));
  },
};

export default invoicesApi;
