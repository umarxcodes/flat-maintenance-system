// =====================  BLOCKS QUERY & MUTATION HOOKS  ========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blocksApi } from "../api/blocks.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useBlocksList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.blocks.list(params),
    queryFn: () => blocksApi.getBlocks(params),
    enabled: Boolean(params?.buildingId),
  });
};

export const useBlockDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.blocks.detail(id),
    queryFn: () => blocksApi.getBlockById(id),
    enabled: Boolean(id),
  });
};

export const useCreateBlockMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => blocksApi.createBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all() });
    },
  });
};
