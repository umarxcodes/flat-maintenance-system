// =====================  FORGOT PASSWORD PAGE  ==================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPasswordMutation } from "../../features/auth/hooks/use-auth-mutations.js";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

export const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useForgotPasswordMutation();

  const onSubmit = (values) => {
    forgotMutation.mutate(values.email, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your registered email address and we'll send you recovery instructions
        </Typography>
      </Box>

      {submitted ? (
        <Stack spacing={3}>
          <Alert severity="success" sx={{ borderRadius: "8px" }}>
            If that email is registered, a reset link is on its way.
          </Alert>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            fullWidth
            startIcon={<ArrowBackIcon />}
          >
            Back to Sign In
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          {forgotMutation.isError && (
            <Alert severity="error">
              {forgotMutation.error?.message || "Failed to initiate password reset."}
            </Alert>
          )}

          <TextField
            label="Email Address"
            fullWidth
            autoComplete="email"
            autoFocus
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={forgotMutation.isPending}
            startIcon={
              forgotMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{ py: 1.25, fontWeight: 700 }}
          >
            {forgotMutation.isPending ? "Submitting..." : "Send Reset Link"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="caption"
              color="primary"
              underline="hover"
            >
              Remember your password? Sign In
            </Link>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default ForgotPasswordPage;
