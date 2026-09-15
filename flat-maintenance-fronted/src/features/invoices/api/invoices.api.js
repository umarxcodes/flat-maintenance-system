// =====================  INVOICES API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const invoicesApi = {
  getInvoices: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.status) cleanParams.status = params.status;
    if (params.billingPeriod) cleanParams.billingPeriod = params.billingPeriod;
    return await apiClient.get(API_ENDPOINTS.INVOICES.BASE, { params: cleanParams });
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
