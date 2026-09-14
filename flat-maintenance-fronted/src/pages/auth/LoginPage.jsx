// =====================  LOGIN PAGE  ===========================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BoltIcon from "@mui/icons-material/Bolt";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation } from "../../features/auth/hooks/use-auth-mutations.js";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const DEMO_ACCOUNTS = [
  {
    label: "Super Admin",
    email: "muhammadumar.codes@gmail.com",
    password: "umarkhan",
    color: "#7C3AED",
  },
  {
    label: "Bldg Admin",
    email: "admin.greenwood@society.local",
    password: "Password123!",
    color: "#1D4ED8",
  },
  {
    label: "Manager",
    email: "manager.sarah@society.local",
    password: "Password123!",
    color: "#0369A1",
  },
  {
    label: "Accountant",
    email: "accountant.dave@society.local",
    password: "Password123!",
    color: "#047857",
  },
  {
    label: "Maintenance",
    email: "tech.carlos@society.local",
    password: "Password123!",
    color: "#B45309",
  },
  {
    label: "Security",
    email: "guard.ahmed@society.local",
    password: "Password123!",
    color: "#7C2D12",
  },
  {
    label: "Owner",
    email: "owner.elena@society.local",
    password: "Password123!",
    color: "#9D174D",
  },
  {
    label: "Tenant",
    email: "tenant.marcus@society.local",
    password: "Password123!",
    color: "#065F46",
  },
];

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutation();

  const fillDemo = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  };

  const onSubmit = (values) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate(from, { replace: true });
      },
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h2"
          sx={{
            fontFamily: "Fraunces, serif",
            fontSize: "1.375rem",
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          Resident &amp; Staff Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your registered credentials to access your portal
        </Typography>
      </Box>

      {/* Quick-fill Demo Credentials */}
      <Box
        sx={{
          mb: 2.5,
          p: 1.5,
          borderRadius: "10px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
          <BoltIcon sx={{ fontSize: 14, color: "warning.main" }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" letterSpacing={0.5}>
            QUICK DEMO LOGIN
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {DEMO_ACCOUNTS.map((account) => (
            <Tooltip key={account.email} title={account.email} placement="top" arrow>
              <Chip
                label={account.label}
                size="small"
                onClick={() => fillDemo(account)}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  color: account.color,
                  borderColor: account.color,
                  bgcolor: `${account.color}12`,
                  "&:hover": {
                    bgcolor: `${account.color}22`,
                  },
                }}
                variant="outlined"
              />
            </Tooltip>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Click any role chip to auto-fill credentials, then press Sign In.
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5 }}>
        <Typography variant="caption" color="text.secondary">
          or enter manually
        </Typography>
      </Divider>

      {loginMutation.isError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {loginMutation.error?.message || "Invalid email or password."}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <TextField
          label="Email Address"
          fullWidth
          autoComplete="email"
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

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register("password")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="caption"
            color="primary"
            underline="hover"
          >
            Forgot your password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loginMutation.isPending}
          startIcon={
            loginMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null
          }
          sx={{ py: 1.25, fontWeight: 700 }}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in to digital lobby"}
        </Button>
      </Stack>
    </Box>
  );
};

export default LoginPage;
