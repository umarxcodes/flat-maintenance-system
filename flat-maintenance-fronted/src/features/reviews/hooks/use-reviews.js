// =====================  REVIEWS QUERY & MUTATION HOOKS  =======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "../api/reviews.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useReviewsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => reviewsApi.getReviews(params),
  });
};

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => reviewsApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
};

export const useModerateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => reviewsApi.moderateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
    },
  });
};
