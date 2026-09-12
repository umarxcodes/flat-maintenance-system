// =====================  EXPENSES QUERY & MUTATION HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useExpensesList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: () => expensesApi.getExpenses(params),
  });
};

export const useCreateExpenseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => expensesApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
    },
  });
};

export const useApproveExpenseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => expensesApi.approveExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
    },
  });
};
