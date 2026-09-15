// =====================  EXPENSES SERVICE  =======================
import { expensesApi } from "../features/expenses/api/expenses.api.js";

/**
 * Service for operational expenditure claims and multi-level approvals.
 */
export const expensesService = {
  getExpenses: (params) => expensesApi.getExpenses(params),
  getExpenseById: (id) => expensesApi.getExpenseById(id),
  createExpense: (payload) => expensesApi.createExpense(payload),
  updateExpense: (id, payload) => expensesApi.updateExpense(id, payload),
  deleteExpense: (id) => expensesApi.deleteExpense(id),
  approveExpense: (id, payload) => expensesApi.approveExpense(id, payload),
  rejectExpense: (id, payload) => expensesApi.rejectExpense(id, payload),
};

export default expensesService;
