// =====================  PAYMENTS QUERY & MUTATION HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const usePaymentsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentsApi.getPayments(params),
  });
};

export const usePaymentDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentsApi.getPaymentById(id),
    enabled: Boolean(id),
  });
};

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => paymentsApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
    },
  });
};
