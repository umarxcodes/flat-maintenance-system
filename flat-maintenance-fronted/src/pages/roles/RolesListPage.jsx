// =====================  SYSTEM ROLES LIST PAGE (POLISHED FIGMA SPEC)  ==============
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import ShieldIcon from "@mui/icons-material/Shield";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import LayersIcon from "@mui/icons-material/Layers";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BuildIcon from "@mui/icons-material/Build";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PersonIcon from "@mui/icons-material/Person";

import { useRolesList } from "../../features/roles/hooks/use-roles.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

// Role metadata config for visual hierarchy & color coding
const ROLE_THEMES = {
  SUPER_ADMIN: {
    icon: AdminPanelSettingsIcon,
    bg: "#EEF2FF",
    color: "#4338CA",
    badge: "Platform Root",
    tier: "Tier 0: Root Authority",
  },
  BUILDING_ADMIN: {
    icon: ShieldIcon,
    bg: "#E0F2FE",
    color: "#0284C7",
    badge: "Building Admin",
    tier: "Tier 1: Property Admin",
  },
  MANAGER: {
    icon: SupervisorAccountIcon,
    bg: "#F0FDF4",
    color: "#16A34A",
    badge: "Operations",
    tier: "Tier 2: Property Ops",
  },
  ACCOUNTANT: {
    icon: AccountBalanceWalletIcon,
    bg: "#FEF3C7",
    color: "#D97706",
    badge: "Finance",
    tier: "Tier 2: Financial Lead",
  },
  MAINTENANCE_STAFF: {
    icon: BuildIcon,
    bg: "#FFEDD5",
    color: "#EA580C",
    badge: "Technician",
    tier: "Tier 3: Field Execution",
  },
  SECURITY_STAFF: {
    icon: SecurityIcon,
    bg: "#F1F5F9",
    color: "#475569",
    badge: "Security & Gate",
    tier: "Tier 3: Gate Ops",
  },
  OWNER: {
    icon: HomeWorkIcon,
    bg: "#ECFDF5",
    color: "#059669",
    badge: "Property Owner",
    tier: "Tier 4: Unit Stakeholder",
  },
  TENANT: {
    icon: PersonIcon,
    bg: "#F5F3FF",
    color: "#7C3AED",
    badge: "Resident",
    tier: "Tier 4: Resident Portal",
  },
};

export const RolesListPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useRolesList();
  const [selectedRole, setSelectedRole] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);

  const rawRoles = data?.roles || (Array.isArray(data) ? data : []);

  const filteredRoles = useMemo(() => {
    if (!search) return rawRoles;
    const q = search.toLowerCase();
    return rawRoles.filter((r) => {
      const code = (r.code || "").toLowerCase();
      const label = (ROLE_LABELS[r.code] || r.name || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      return code.includes(q) || label.includes(q) || desc.includes(q);
    });
  }, [rawRoles, search]);

  // Metrics
  const totalRoles = rawRoles.length;
  const totalAssignedPermissions = useMemo(() => {
    const all = new Set();
    rawRoles.forEach((r) => r.permissions?.forEach((p) => all.add(p)));
    return all.size;
  }, [rawRoles]);

  const totalModules = useMemo(() => {
    const modules = new Set();
    rawRoles.forEach((r) => {
      r.permissions?.forEach((p) => {
        const mod = p.split("_")[0];
        if (mod) modules.add(mod);
      });
    });
    return modules.size || 24;
  }, [rawRoles]);

  // Group permissions in modal
  const modalGroupedPermissions = useMemo(() => {
    if (!selectedRole?.permissions) return {};
    const map = {};
    const q = permissionSearch.toLowerCase();
    selectedRole.permissions.forEach((perm) => {
      if (q && !perm.toLowerCase().includes(q)) return;
      const mod = perm.split("_")[0];
      if (!map[mod]) map[mod] = [];
      map[mod].push(perm);
    });
    return map;
  }, [selectedRole, permissionSearch]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(code);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const columns = [
    {
      id: "name",
      label: "Role Identity",
      render: (_, row) => {
        const theme = ROLE_THEMES[row.code] || {
          icon: ShieldIcon,
          bg: DESIGN_TOKENS.brand[50],
          color: DESIGN_TOKENS.brand[600],
        };
        const IconComponent = theme.icon;

        return (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: theme.bg,
                color: theme.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconComponent sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
                {ROLE_LABELS[row.code] || row.name || row.code}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontFamily: "monospace" }}>
                {row.code}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: "description",
      label: "Operational Scope & Purpose",
      render: (val) => (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", maxWidth: 440 }}>
          {val || "Predefined system authority with strict operational boundaries."}
        </Typography>
      ),
    },
    {
      id: "permissions",
      label: "Permissions Granted",
      render: (val) => (
        <Chip
          label={`${val?.length || 0} Grants`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: DESIGN_TOKENS.brand[50],
            color: DESIGN_TOKENS.brand[600],
            borderColor: "transparent",
          }}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedRole(row);
            setPermissionSearch("");
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "none",
            borderColor: DESIGN_TOKENS.line[200],
            color: DESIGN_TOKENS.brand[600],
            "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
          }}
        >
          Inspect Matrix
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title="System Roles & Authority Matrix"
        subtitle="Authoritative RBAC directory governing access tokens, operational boundaries, and platform capabilities"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Roles" }]}
        action={
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
            sx={{
              bgcolor: "#FFFFFF",
              border: `1px solid ${DESIGN_TOKENS.line[200]}`,
              borderRadius: "8px",
              "& .MuiToggleButton-root": {
                border: "none",
                px: 1.5,
                py: 0.5,
                color: DESIGN_TOKENS.text.secondary,
                "&.Mui-selected": {
                  bgcolor: DESIGN_TOKENS.brand[50],
                  color: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                },
              },
            }}
          >
            <ToggleButton value="cards">
              <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
            </ToggleButton>
            <ToggleButton value="table">
              <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {/* Unified Roles & Permissions Navigation Tabs */}
      <Box sx={{ borderBottom: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 3 }}>
        <Tabs
          value="/roles"
          onChange={(_, val) => navigate(val)}
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              fontFamily: FONT_UI,
              minHeight: 44,
              px: 2,
              color: DESIGN_TOKENS.text.secondary,
              "&.Mui-selected": {
                color: DESIGN_TOKENS.brand[600],
                fontWeight: 700,
              },
            },
            "& .MuiTabs-indicator": {
              bgcolor: DESIGN_TOKENS.brand[600],
              height: 2.5,
              borderRadius: "2px 2px 0 0",
            },
          }}
        >
          <Tab
            icon={<ShieldIcon sx={{ fontSize: 18, mr: 0.75 }} />}
            iconPosition="start"
            label="Roles Authority Matrix"
            value="/roles"
          />
          <Tab
            icon={<VpnKeyIcon sx={{ fontSize: 18, mr: 0.75 }} />}
            iconPosition="start"
            label="Permissions Registry"
            value="/permissions"
          />
        </Tabs>
      </Box>

      {/* Top StatCards (100% Full-Width Responsive CSS Grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          width: "100%",
          mb: 3,
        }}
      >
        <StatCard
          value={isLoading ? "..." : totalRoles}
          label="Configured Roles"
          delta="Active RBAC roles"
          icon={<ShieldIcon />}
          iconBg="#EEF2FF"
          iconColor={DESIGN_TOKENS.brand[600]}
        />
        <StatCard
          value={isLoading ? "..." : totalAssignedPermissions}
          label="Active Permissions"
          delta="Granular access tokens"
          icon={<VpnKeyIcon />}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <StatCard
          value={isLoading ? "..." : totalModules}
          label="Governed Modules"
          delta="Isolated security domains"
          icon={<LayersIcon />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
        />
        <StatCard
          value="Enterprise RBAC"
          label="Security Standard"
          delta="Hierarchical token isolation"
          icon={<SecurityIcon />}
          iconBg="#F8FAFC"
          iconColor="#0F172A"
        />
      </Box>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search role by name, code, or operational scope..."
        onReset={() => setSearch("")}
        hasActiveFilters={Boolean(search)}
      />

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredRoles.length === 0 ? (
        <EmptyState
          title="No system roles found"
          description="No system roles matched your search query. Clear your search filter to view all roles."
          action={
            search && (
              <Button variant="outlined" onClick={() => setSearch("")}>
                Reset Search
              </Button>
            )
          }
        />
      ) : viewMode === "cards" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            },
            gap: 2.5,
            width: "100%",
          }}
        >
          {filteredRoles.map((role) => {
            const roleKey = role.id || role._id || role.code;
            const permissionsCount = role.permissions?.length || 0;
            const theme = ROLE_THEMES[role.code] || {
              icon: ShieldIcon,
              bg: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
              badge: "Role",
              tier: "Custom Tier",
            };
            const IconComponent = theme.icon;

            return (
              <Paper
                key={roleKey}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  borderColor: DESIGN_TOKENS.line[200],
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  "&:hover": {
                    borderColor: DESIGN_TOKENS.brand[600],
                    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.08)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box>
                  {/* Card Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "11px",
                        bgcolor: theme.bg,
                        color: theme.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 22 }} />
                    </Box>
                    <Chip
                      label={theme.badge}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.6875rem",
                        height: 22,
                        bgcolor: theme.bg,
                        color: theme.color,
                        borderRadius: "6px",
                      }}
                    />
                  </Box>

                  {/* Title & Code */}
                  <Typography
                    sx={{
                      fontFamily: FONT_UI,
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: DESIGN_TOKENS.text.primary,
                      lineHeight: 1.25,
                      mb: 0.5,
                    }}
                  >
                    {ROLE_LABELS[role.code] || role.name || role.code}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "inline-block",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: DESIGN_TOKENS.brand[600],
                      bgcolor: DESIGN_TOKENS.brand[50],
                      px: 0.85,
                      py: 0.2,
                      borderRadius: "4px",
                      mb: 1.5,
                    }}
                  >
                    {role.code}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: DESIGN_TOKENS.text.secondary,
                      fontSize: "0.8125rem",
                      lineHeight: 1.5,
                      minHeight: 48,
                      mb: 2,
                    }}
                  >
                    {role.description || "System authority role with predefined operational capabilities across properties."}
                  </Typography>
                </Box>

                {/* Footer Meta & Action */}
                <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={`${permissionsCount} Grants`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        bgcolor: "#F1F5F9",
                        color: DESIGN_TOKENS.text.primary,
                        height: 24,
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedRole(role);
                        setPermissionSearch("");
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: DESIGN_TOKENS.line[200],
                        color: DESIGN_TOKENS.brand[600],
                        borderRadius: "8px",
                        px: 1.5,
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.brand[600],
                          bgcolor: DESIGN_TOKENS.brand[50],
                        },
                      }}
                    >
                      Inspect Matrix
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        <DataTable columns={columns} rows={filteredRoles} isLoading={isLoading} />
      )}

      {/* Role Permissions Detail Dialog */}
      <Dialog
        open={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: DESIGN_TOKENS.brand[50],
                  color: DESIGN_TOKENS.brand[600],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                  {selectedRole ? ROLE_LABELS[selectedRole.code] || selectedRole.name : ""} Authority Matrix
                </Typography>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontFamily: "monospace" }}>
                  Role Token: {selectedRole?.code} • {selectedRole?.permissions?.length || 0} Total Grants
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setSelectedRole(null)} sx={{ color: DESIGN_TOKENS.text.secondary }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}>
            {selectedRole?.description || "Authoritative operational boundaries assigned to this system role."}
          </Typography>

          <TextField
            size="small"
            fullWidth
            placeholder="Search permission token (e.g., BUILDING_CREATE, INVOICE_READ)..."
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          {Object.keys(modalGroupedPermissions).length === 0 ? (
            <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, py: 3, textAlign: "center" }}>
              No permission tokens match your search query.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {Object.entries(modalGroupedPermissions).map(([mod, perms]) => (
                <Box
                  key={mod}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "#F8FAFC",
                    border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
                      {mod} Module
                    </Typography>
                    <Chip
                      label={`${perms.length} grants`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.6875rem",
                        height: 20,
                        bgcolor: DESIGN_TOKENS.brand[50],
                        color: DESIGN_TOKENS.brand[600],
                      }}
                    />
                  </Stack>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {perms.map((p) => (
                      <Chip
                        key={p}
                        label={p}
                        size="small"
                        onClick={() => handleCopy(p)}
                        onDelete={() => handleCopy(p)}
                        deleteIcon={
                          copiedToken === p ? (
                            <CheckIcon sx={{ fontSize: 13, color: "success.main" }} />
                          ) : (
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                          )
                        }
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          bgcolor: "#FFFFFF",
                          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                          color: DESIGN_TOKENS.text.primary,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: DESIGN_TOKENS.brand[50],
                            borderColor: DESIGN_TOKENS.brand[600],
                            color: DESIGN_TOKENS.brand[600],
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setSelectedRole(null)}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesListPage;
