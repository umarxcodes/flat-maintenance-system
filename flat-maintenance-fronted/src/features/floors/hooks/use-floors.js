// =====================  FLOORS QUERY & MUTATION HOOKS  ========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { floorsApi } from "../api/floors.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useFloorsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.floors.list(params),
    queryFn: () => floorsApi.getFloors(params),
    enabled: Boolean(params?.blockId),
  });
};

export const useFloorDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.floors.detail(id),
    queryFn: () => floorsApi.getFloorById(id),
    enabled: Boolean(id),
  });
};

export const useCreateFloorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => floorsApi.createFloor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.all() });
    },
  });
};
