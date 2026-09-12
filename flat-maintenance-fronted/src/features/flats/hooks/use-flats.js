// =====================  FLATS QUERY & MUTATION HOOKS  =========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flatsApi } from "../api/flats.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useFlatsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.flats.list(params),
    queryFn: () => flatsApi.getFlats(params),
  });
};

export const useFlatDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.flats.detail(id),
    queryFn: () => flatsApi.getFlatById(id),
    enabled: Boolean(id),
  });
};

export const useCreateFlatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => flatsApi.createFlat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flats.all() });
    },
  });
};

export const useUpdateFlatStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => flatsApi.updateFlatStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flats.all() });
    },
  });
};
