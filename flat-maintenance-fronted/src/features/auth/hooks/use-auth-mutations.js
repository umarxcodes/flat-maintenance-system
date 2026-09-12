// =====================  AUTH MUTATION HOOKS  ==================
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api.js";
import { useAuth } from "../../../providers/auth-provider.jsx";

export const useLoginMutation = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: (data) => {
      login(data);
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (email) => authApi.forgotPassword(email),
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload) => authApi.resetPassword(payload),
  });
};
