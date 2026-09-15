// =====================  INVOICES QUERY & MUTATION HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useInvoicesList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoicesApi.getInvoices(params),
  });
};

export const useInvoiceDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoicesApi.getInvoiceById(id),
    enabled: Boolean(id),
  });
};

export const useGenerateBatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => invoicesApi.generateBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
    },
  });
};

export const useVoidInvoiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => invoicesApi.voidInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
    },
  });
};
