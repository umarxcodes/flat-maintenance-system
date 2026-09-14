// =====================  SYSTEM ROLES LIST PAGE  ==============
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
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
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { useRolesList } from "../../features/roles/hooks/use-roles.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

export const RolesListPage = () => {
  const { data, isLoading } = useRolesList();
  const [selectedRole, setSelectedRole] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

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

  const columns = [
    {
      id: "name",
      label: "Role Identity",
      render: (_, row) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldIcon sx={{ fontSize: 20 }} />
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
      ),
    },
    {
      id: "description",
      label: "Operational Scope & Purpose",
      render: (val) => (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", maxWidth: 420 }}>
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
    <Box>
      <PageHeader
        title="System Roles & Authority Matrix"
        subtitle="Authoritative RBAC directory governing access tokens and hierarchical privileges"
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

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Configured Roles
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalRoles}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F0FDF4",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VpnKeyIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Active Permission Codes
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalAssignedPermissions}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F8FAFC",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SecurityIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Security Standard
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                Enterprise RBAC
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search role by name, code, or description..."
        onReset={() => setSearch("")}
        hasActiveFilters={Boolean(search)}
      />

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredRoles.length === 0 ? (
        <EmptyState
          title="No system roles found"
          description="No system roles matched your search query. Clear search filter to view all roles."
          action={
            search && (
              <Button variant="outlined" onClick={() => setSearch("")}>
                Reset Search
              </Button>
            )
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredRoles.map((role) => {
            const roleKey = role.id || role._id || role.code;
            const permissionsCount = role.permissions?.length || 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={roleKey}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    borderColor: DESIGN_TOKENS.line[200],
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    "&:hover": {
                      borderColor: DESIGN_TOKENS.brand[600],
                      boxShadow: "0 6px 18px -3px rgba(15, 23, 42, 0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "10px",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ShieldIcon sx={{ fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                          {ROLE_LABELS[role.code] || role.name || role.code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontFamily: "monospace" }}>
                          {role.code}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 2, minHeight: 40 }}>
                      {role.description || "System authority role with predefined operational capabilities."}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={`${permissionsCount} Permissions`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                        }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRole(role);
                          setPermissionSearch("");
                        }}
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
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
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
          sx: { borderRadius: "16px" },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: DESIGN_TOKENS.brand[50],
                color: DESIGN_TOKENS.brand[600],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                {selectedRole ? ROLE_LABELS[selectedRole.code] || selectedRole.name : ""} Permissions
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontFamily: "monospace" }}>
                Role Token: {selectedRole?.code}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}>
            {selectedRole?.description || "Authoritative operational boundaries assigned to this system role."}
          </Typography>

          <TextField
            size="small"
            fullWidth
            placeholder="Filter permission tokens in this role..."
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5 }}
          />

          <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
            {Object.keys(modalGroupedPermissions).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                No permissions match "{permissionSearch}".
              </Typography>
            ) : (
              Object.entries(modalGroupedPermissions).map(([moduleName, perms]) => (
                <Box key={moduleName} sx={{ mb: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: DESIGN_TOKENS.brand[600],
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      mb: 1,
                    }}
                  >
                    {moduleName} Module ({perms.length})
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {perms.map((perm) => (
                      <Chip
                        key={perm}
                        label={perm}
                        size="small"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          bgcolor: "#F8FAFC",
                          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                          color: "#0F172A",
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedRole(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Matrix
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesListPage;
