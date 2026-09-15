// =====================  NOTICES QUERY & MUTATION HOOKS  =======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticesApi } from "../api/notices.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useNoticesList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.notices.list(params),
    queryFn: () => noticesApi.getNotices(params),
  });
};

export const usePublishNoticeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => noticesApi.publishNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notices.all() });
    },
  });
};

export const useRetractNoticeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => noticesApi.retractNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notices.all() });
    },
  });
};
