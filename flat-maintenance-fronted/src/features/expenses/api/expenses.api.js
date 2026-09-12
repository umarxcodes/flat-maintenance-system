// =====================  EXPENSES API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const expensesApi = {
  getExpenses: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.EXPENSES.BASE, { params });
  },

  createExpense: async (data) => {
    return await apiClient.post(API_ENDPOINTS.EXPENSES.BASE, data);
  },

  approveExpense: async (id, data = {}) => {
    return await apiClient.patch(API_ENDPOINTS.EXPENSES.APPROVE(id), data);
  },
};

export default expensesApi;
