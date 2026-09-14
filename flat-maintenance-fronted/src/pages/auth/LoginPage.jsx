// =====================  LOGIN PAGE (SUPER CLEAN FIGMA SPEC)  ===========================
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
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation } from "../../features/auth/hooks/use-auth-mutations.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const DEMO_ROLES = [
  {
    role: "Super Admin",
    email: "muhammadumar.codes@gmail.com",
    password: "umarkhan",
    description: "System-wide administrative authority",
  },
  {
    role: "Building Admin",
    email: "admin.greenwood@society.local",
    password: "Password123!",
    description: "Society & building manager",
  },
  {
    role: "Manager",
    email: "manager.sarah@society.local",
    password: "Password123!",
    description: "Operations & triage management",
  },
  {
    role: "Accountant",
    email: "accountant.dave@society.local",
    password: "Password123!",
    description: "Invoicing, payments & expenses",
  },
  {
    role: "Maintenance Staff",
    email: "tech.carlos@society.local",
    password: "Password123!",
    description: "Assigned tasks & work orders",
  },
  {
    role: "Security Staff",
    email: "guard.ahmed@society.local",
    password: "Password123!",
    description: "Gate terminal & visitor check-in",
  },
  {
    role: "Owner",
    email: "owner.elena@society.local",
    password: "Password123!",
    description: "Property owner portal & dues",
  },
  {
    role: "Tenant",
    email: "tenant.marcus@society.local",
    password: "Password123!",
    description: "Resident portal & maintenance requests",
  },
];

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [demoMenuAnchor, setDemoMenuAnchor] = useState(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
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

  const handleSelectDemo = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setSelectedDemoRole(account.role);
    setDemoMenuAnchor(null);
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
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: "1.5rem",
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.02em",
            mb: 0.75,
          }}
        >
          Welcome back
        </Typography>
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
          Enter your credentials to access your society workspace
        </Typography>
      </Box>

      {/* Backend / Network Error */}
      {loginMutation.isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          {loginMutation.error?.message || "Invalid email or password. Please try again."}
        </Alert>
      )}

      {/* Form Fields */}
      <Stack spacing={2.5}>
        <TextField
          label="Email address"
          fullWidth
          autoComplete="email"
          placeholder="name@society.local"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register("email")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
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
          placeholder="••••••••"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register("password")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
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
                      <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
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
            variant="body2"
            sx={{
              color: DESIGN_TOKENS.brand[600],
              fontWeight: 500,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Forgot password?
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
          sx={{
            py: 1.3,
            fontSize: "0.9375rem",
            fontWeight: 600,
            borderRadius: "8px",
            bgcolor: DESIGN_TOKENS.brand[600],
            "&:hover": {
              bgcolor: DESIGN_TOKENS.brand[700],
            },
          }}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </Button>
      </Stack>

      {/* Super Clean Demo Switcher at Bottom */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", px: 1, fontWeight: 500 }}>
          Quick Evaluation
        </Typography>
      </Divider>

      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setDemoMenuAnchor(e.currentTarget)}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          startIcon={<BoltRoundedIcon sx={{ color: DESIGN_TOKENS.brand[600] }} />}
          sx={{
            borderColor: DESIGN_TOKENS.line[200],
            color: DESIGN_TOKENS.text.primary,
            bgcolor: DESIGN_TOKENS.surface[50],
            py: 0.8,
            px: 2,
            fontSize: "0.8125rem",
            fontWeight: 500,
            "&:hover": {
              borderColor: DESIGN_TOKENS.brand[600],
              bgcolor: DESIGN_TOKENS.brand[50],
            },
          }}
        >
          {selectedDemoRole ? `Autofilled: ${selectedDemoRole}` : "Select Demo Account to Test"}
        </Button>

        <Menu
          anchorEl={demoMenuAnchor}
          open={Boolean(demoMenuAnchor)}
          onClose={() => setDemoMenuAnchor(null)}
          transformOrigin={{ horizontal: "center", vertical: "top" }}
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                width: 320,
                maxHeight: 380,
                mt: 1,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: DESIGN_TOKENS.line[200],
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              ONE-CLICK TEST ACCOUNTS
            </Typography>
          </Box>
          {DEMO_ROLES.map((account) => (
            <MenuItem
              key={account.email}
              onClick={() => handleSelectDemo(account)}
              selected={selectedDemoRole === account.role}
              sx={{
                py: 1.25,
                px: 2,
                gap: 1.5,
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[50] },
                "&.Mui-selected": { bgcolor: DESIGN_TOKENS.brand[100] },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {account.role}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {account.email}
                  </Typography>
                }
              />
              {selectedDemoRole === account.role && (
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: DESIGN_TOKENS.brand[600] }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
};

export default LoginPage;
