// =====================  RESET PASSWORD PAGE  ===================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPasswordMutation } from "../../features/auth/hooks/use-auth-mutations.js";

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: "",
      confirmPassword: "",
    },
  });

  const resetMutation = useResetPasswordMutation();

  const onSubmit = (values) => {
    resetMutation.mutate(
      { token: values.token, password: values.password },
      {
        onSuccess: () => {
          setSuccess(true);
        },
      }
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Set New Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your security reset token and choose a new password
        </Typography>
      </Box>

      {success ? (
        <Stack spacing={3}>
          <Alert severity="success">
            Your password has been successfully reset! You may now sign in with your new credentials.
          </Alert>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            sx={{ py: 1.25, fontWeight: 700 }}
          >
            Sign In Now
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          {resetMutation.isError && (
            <Alert severity="error">
              {resetMutation.error?.message || "Failed to reset password. The token may be expired or invalid."}
            </Alert>
          )}

          <TextField
            label="Reset Token"
            fullWidth
            error={Boolean(errors.token)}
            helperText={errors.token?.message}
            {...register("token")}
          />

          <TextField
            label="New Password"
            type="password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register("password")}
          />

          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={resetMutation.isPending}
            startIcon={resetMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ py: 1.25, fontWeight: 700 }}
          >
            {resetMutation.isPending ? "Resetting..." : "Confirm New Password"}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default ResetPasswordPage;
