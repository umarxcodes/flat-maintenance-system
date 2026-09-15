// =====================  EXPENSES API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const expensesApi = {
  getExpenses: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.category) cleanParams.category = params.category;
    if (params.status) cleanParams.status = params.status;
    if (params.fromDate) cleanParams.fromDate = params.fromDate;
    if (params.toDate) cleanParams.toDate = params.toDate;
    return await apiClient.get(API_ENDPOINTS.EXPENSES.BASE, { params: cleanParams });
  },

  createExpense: async (data) => {
    return await apiClient.post(API_ENDPOINTS.EXPENSES.BASE, data);
  },

  approveExpense: async (id, data = {}) => {
    return await apiClient.patch(API_ENDPOINTS.EXPENSES.APPROVE(id), data);
  },
};

export default expensesApi;
