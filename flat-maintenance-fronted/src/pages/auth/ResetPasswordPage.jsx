// =====================  RESET PASSWORD PAGE (AUTHORITATIVE MASTER SPEC)  ===================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPasswordMutation } from "../../features/auth/hooks/use-auth-mutations.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        STRONG_PASSWORD_REGEX,
        "Must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password") || "";

  // Password strength calculator
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", color: DESIGN_TOKENS.line[300] };
    let score = 0;
    if (pass.length >= 8) score += 35;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 35;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 30;
    if (score < 40) return { score, label: "Weak", color: DESIGN_TOKENS.danger[600] };
    if (score < 75) return { score, label: "Fair", color: DESIGN_TOKENS.accent.amber };
    return { score, label: "Strong", color: DESIGN_TOKENS.accent.green };
  };

  const strength = getStrength(passwordVal);
  const resetMutation = useResetPasswordMutation();

  const onSubmit = (values) => {
    resetMutation.mutate(
      {
        token: values.token.trim(),
        newPassword: values.password,
        password: values.password,
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
      }
    );
  };

  const isTokenExpiredOrInvalid =
    resetMutation.isError &&
    (resetMutation.error?.message?.toLowerCase().includes("token") ||
      resetMutation.error?.message?.toLowerCase().includes("expired"));

  // Dedicated Expired / Invalid Token Card per Master Spec
  if (isTokenExpiredOrInvalid) {
    return (
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "12px",
            bgcolor: "#FEE2E2",
            color: DESIGN_TOKENS.danger[600],
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <LinkOffIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1.25rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.015em",
            mb: 1,
          }}
        >
          This link has expired or is invalid
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: DESIGN_TOKENS.text.secondary, mb: 3.5, maxWidth: 380, mx: "auto" }}
        >
          Password reset tokens are time-limited for security (15 minutes). Please initiate a new
          recovery request.
        </Typography>
        <Button
          component={RouterLink}
          to="/forgot-password"
          variant="contained"
          fullWidth
          startIcon={<ArrowBackIcon />}
          sx={{
            py: 1.25,
            fontWeight: 600,
            bgcolor: DESIGN_TOKENS.brand[600],
            "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
          }}
        >
          Request New Reset Link
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h2"
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1.375rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          Reset Password
        </Typography>
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
          Enter your security reset token and choose a new password
        </Typography>
      </Box>

      {success ? (
        <Stack spacing={3}>
          <Alert severity="success" sx={{ borderRadius: "8px" }}>
            Your password has been successfully reset! You may now sign in with your new
            credentials.
          </Alert>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            sx={{
              py: 1.25,
              fontWeight: 600,
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Sign In Now
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          {resetMutation.isError && !isTokenExpiredOrInvalid && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>
              {resetMutation.error?.message || "Failed to reset password. Please try again."}
            </Alert>
          )}

          <TextField
            label="Reset Token"
            fullWidth
            error={Boolean(errors.token)}
            helperText={errors.token?.message}
            {...register("token")}
          />

          <Box>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register("password")}
            />
            {passwordVal && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Password Strength:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: strength.color }}>
                    {strength.label}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={strength.score}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: DESIGN_TOKENS.surface[100],
                    "& .MuiLinearProgress-bar": { bgcolor: strength.color },
                  }}
                />
              </Box>
            )}
          </Box>

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
            startIcon={
              resetMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{
              py: 1.25,
              fontWeight: 600,
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            {resetMutation.isPending ? "Resetting..." : "Reset password"}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default ResetPasswordPage;
