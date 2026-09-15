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
    name: "Muhammad Umar",
    email: "muhammadumar.codes@gmail.com",
    password: "umarkhan",
    description: "Platform Super Administrator",
  },
  {
    role: "Building Admin",
    name: "Tariq Mahmood",
    email: "admin.alraziq@society.local",
    password: "Password123!",
    description: "Society & Building Executive",
  },
  {
    role: "Manager",
    name: "Sarah Khan",
    email: "manager.sarah@society.local",
    password: "Password123!",
    description: "Operations & Triage Supervisor",
  },
  {
    role: "Accountant",
    name: "Dawood Ahmed",
    email: "accountant.dawood@society.local",
    password: "Password123!",
    description: "Accounts & Financial Controller",
  },
  {
    role: "Maintenance Staff",
    name: "Kamran Akram",
    email: "tech.kamran@society.local",
    password: "Password123!",
    description: "Senior MEP Technical Specialist",
  },
  {
    role: "Security Staff",
    name: "Ahmed Raza",
    email: "guard.ahmed@society.local",
    password: "Password123!",
    description: "Main Gate Security & Visitor Protocol",
  },
  {
    role: "Owner",
    name: "Fatima Zahra",
    email: "owner.fatima@society.local",
    password: "Password123!",
    description: "Resident & Flat 101 Owner",
  },
  {
    role: "Tenant",
    name: "Hamza Tariq",
    email: "tenant.hamza@society.local",
    password: "Password123!",
    description: "Resident & Flat 101 Tenant",
  },
];

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [demoMenuAnchor, setDemoMenuAnchor] = useState(null);
  const [selectedDemoAccount, setSelectedDemoAccount] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const currentEmail = watch("email");
  // Check if typed email matches one of the demo accounts
  const matchedUser = selectedDemoAccount || DEMO_ROLES.find(
    (u) => u.email.toLowerCase() === (currentEmail || "").trim().toLowerCase()
  );

  const loginMutation = useLoginMutation();

  const handleSelectDemo = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setSelectedDemoAccount(account);
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
          That email or password doesn't match our records.
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

        {matchedUser && (
          <Box
            sx={{
              py: 1,
              px: 1.5,
              bgcolor: DESIGN_TOKENS.brand[50],
              border: "1px solid",
              borderColor: DESIGN_TOKENS.brand[200],
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: DESIGN_TOKENS.brand[600] }} />
            <Box sx={{ minWidth: 0, textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.brand[900], lineHeight: 1.2 }}>
                {matchedUser.name}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.brand[700], fontWeight: 500 }}>
                {matchedUser.role} • Al-Raziq Heights
              </Typography>
            </Box>
          </Box>
        )}

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
          {loginMutation.isPending
            ? `Signing in ${matchedUser ? matchedUser.name : ""}...`
            : matchedUser
            ? `Sign In as ${matchedUser.name}`
            : "Sign In"}
        </Button>
      </Stack>

      {/* Super Clean Demo Switcher at Bottom */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", px: 1, fontWeight: 500 }}>
          Quick Evaluation (Pakistani Profiles)
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
          {selectedDemoAccount
            ? `Active: ${selectedDemoAccount.name} (${selectedDemoAccount.role})`
            : "Select Pakistani Demo Account"}
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
                width: 360,
                maxHeight: 400,
                mt: 1,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: DESIGN_TOKENS.line[200],
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", bgcolor: DESIGN_TOKENS.surface[50] }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: "0.04em" }}>
              PAKISTANI DEMO ACCOUNTS (ONE-CLICK)
            </Typography>
          </Box>
          {DEMO_ROLES.map((account) => (
            <MenuItem
              key={account.email}
              onClick={() => handleSelectDemo(account)}
              selected={selectedDemoAccount?.email === account.email}
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {account.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: DESIGN_TOKENS.brand[700],
                        bgcolor: DESIGN_TOKENS.brand[50],
                        px: 0.75,
                        py: 0.2,
                        borderRadius: "4px",
                        border: "1px solid",
                        borderColor: DESIGN_TOKENS.brand[200],
                      }}
                    >
                      {account.role}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                    {account.email} • {account.description}
                  </Typography>
                }
              />
              {selectedDemoAccount?.email === account.email && (
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
