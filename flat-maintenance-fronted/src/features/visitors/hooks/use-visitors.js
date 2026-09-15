// =====================  VISITORS QUERY & MUTATION HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { visitorsApi } from "../api/visitors.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useVisitorsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.visitors.list(params),
    queryFn: () => visitorsApi.getVisitors(params),
  });
};

export const useCreateVisitorPassMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => visitorsApi.createVisitorPass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all() });
    },
  });
};

export const useCheckInVisitorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (arg) => {
      if (typeof arg === "string") {
        return visitorsApi.checkInVisitor(arg);
      }
      const { id, ...data } = arg;
      return visitorsApi.checkInVisitor(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all() });
    },
  });
};

export const useCheckOutVisitorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => visitorsApi.checkOutVisitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all() });
    },
  });
};
