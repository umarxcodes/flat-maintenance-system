// =====================  PERMISSIONS REGISTRY PAGE  ===========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import SecurityIcon from "@mui/icons-material/Security";
import LayersIcon from "@mui/icons-material/Layers";
import { usePermissionsList } from "../../features/permissions/hooks/use-permissions.js";
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

export const PermissionsListPage = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [copiedToken, setCopiedToken] = useState(null);
  const { data, isLoading } = usePermissionsList();

  const rawList = useMemo(() => {
    return data?.permissions || (Array.isArray(data) ? data : []);
  }, [data]);

  // Flattened list for search and table
  const allPermissions = useMemo(() => {
    return rawList.map((perm) => {
      const code = typeof perm === "string" ? perm : perm.code;
      const description = typeof perm === "object" ? perm.description : "";
      const moduleName = code.split("_")[0];
      return { code, description, moduleName };
    });
  }, [rawList]);

  const filteredPermissions = useMemo(() => {
    if (!search) return allPermissions;
    const q = search.toLowerCase();
    return allPermissions.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.moduleName.toLowerCase().includes(q)
    );
  }, [allPermissions, search]);

  // Group permissions by module prefix
  const groupedPermissions = useMemo(() => {
    const map = {};
    filteredPermissions.forEach((item) => {
      if (!map[item.moduleName]) {
        map[item.moduleName] = [];
      }
      map[item.moduleName].push(item);
    });
    return map;
  }, [filteredPermissions]);

  const groupKeys = Object.keys(groupedPermissions);
  const totalModules = new Set(allPermissions.map((p) => p.moduleName)).size;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(code);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const columns = [
    {
      id: "code",
      label: "Security Token Code",
      render: (_, row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: "0.8125rem",
              color: DESIGN_TOKENS.brand[600],
            }}
          >
            {row.code}
          </Typography>
          <Tooltip title={copiedToken === row.code ? "Copied!" : "Copy Token Code"}>
            <IconButton size="small" onClick={() => handleCopy(row.code)} sx={{ color: DESIGN_TOKENS.text.secondary }}>
              {copiedToken === row.code ? (
                <CheckIcon sx={{ fontSize: 14, color: "success.main" }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "moduleName",
      label: "Module Scope",
      render: (val) => (
        <Chip
          label={val}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: DESIGN_TOKENS.brand[50],
            color: DESIGN_TOKENS.brand[600],
          }}
        />
      ),
    },
    {
      id: "description",
      label: "Authority Scope Description",
      render: (val) => (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem" }}>
          {val || "Granular authority permission token governing platform execution."}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Permissions Registry"
        subtitle="Catalog of granular platform security tokens governing access across all 24 domain modules"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Permissions" }]}
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
              <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Module Groups
            </ToggleButton>
            <ToggleButton value="table">
              <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> Token Table
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {/* Quick Metrics */}
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
              <VpnKeyIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Total Tokens
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : allPermissions.length}
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
              <LayersIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Governed Modules
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalModules}
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
                Authorization Model
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                Granular ABAC & RBAC
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permission code (e.g. BUILDING_READ), module, or description..."
        onReset={() => setSearch("")}
        hasActiveFilters={Boolean(search)}
      />

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : groupKeys.length === 0 ? (
        <EmptyState
          title="No permissions match your search"
          description="Try modifying your search term to view platform permission tokens."
          action={
            search && (
              <Button variant="outlined" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {groupKeys.map((moduleName) => {
            const items = groupedPermissions[moduleName];

            return (
              <Grid item xs={12} md={6} key={moduleName}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: "14px",
                    borderColor: DESIGN_TOKENS.line[200],
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
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
                        <VpnKeyIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: DESIGN_TOKENS.text.primary }}>
                          {moduleName} Module
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Domain Access Boundary
                        </Typography>
                      </Box>
                      <Chip
                        label={`${items.length} Tokens`}
                        size="small"
                        sx={{
                          ml: "auto",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                        }}
                      />
                    </Stack>

                    <Divider sx={{ mb: 2, borderColor: DESIGN_TOKENS.line[200] }} />

                    <Stack spacing={1.25}>
                      {items.map((item) => (
                        <Box
                          key={item.code}
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            bgcolor: "#F8FAFC",
                            border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: DESIGN_TOKENS.brand[600],
                              bgcolor: "#FFFFFF",
                            },
                          }}
                        >
                          <Box sx={{ pr: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                color: DESIGN_TOKENS.brand[600],
                                fontSize: "0.8125rem",
                                mb: 0.25,
                              }}
                            >
                              {item.code}
                            </Typography>
                            {item.description && (
                              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                                {item.description}
                              </Typography>
                            )}
                          </Box>
                          <Tooltip title={copiedToken === item.code ? "Copied!" : "Copy Token Code"}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(item.code)}
                              sx={{ color: DESIGN_TOKENS.text.secondary, p: 0.5 }}
                            >
                              {copiedToken === item.code ? (
                                <CheckIcon sx={{ fontSize: 15, color: "success.main" }} />
                              ) : (
                                <ContentCopyIcon sx={{ fontSize: 15 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable columns={columns} rows={filteredPermissions} isLoading={isLoading} />
      )}
    </Box>
  );
};

export default PermissionsListPage;
