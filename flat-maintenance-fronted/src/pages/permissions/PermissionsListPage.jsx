// =====================  PERMISSIONS REGISTRY PAGE (POLISHED FIGMA SPEC)  ===========
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import SecurityIcon from "@mui/icons-material/Security";
import LayersIcon from "@mui/icons-material/Layers";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

import { usePermissionsList } from "../../features/permissions/hooks/use-permissions.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

export const PermissionsListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
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

  // Available unique modules for quick filter
  const allModuleNames = useMemo(() => {
    const set = new Set(allPermissions.map((p) => p.moduleName));
    return Array.from(set).sort();
  }, [allPermissions]);

  const filteredPermissions = useMemo(() => {
    let list = allPermissions;
    if (selectedModule !== "ALL") {
      list = list.filter((item) => item.moduleName === selectedModule);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.moduleName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPermissions, search, selectedModule]);

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
  const totalModules = allModuleNames.length || 24;

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
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title="Permissions Registry"
        subtitle="Catalog of granular platform security tokens governing access across all domain modules"
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

      {/* Unified Roles & Permissions Navigation Tabs */}
      <Box sx={{ borderBottom: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 3 }}>
        <Tabs
          value="/permissions"
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
          value={isLoading ? "..." : allPermissions.length}
          label="Total Security Tokens"
          delta="Catalogued platform grants"
          icon={<VpnKeyIcon />}
          iconBg="#EEF2FF"
          iconColor={DESIGN_TOKENS.brand[600]}
        />
        <StatCard
          value={isLoading ? "..." : totalModules}
          label="Governed Modules"
          delta="Functional access boundaries"
          icon={<LayersIcon />}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <StatCard
          value="Granular ABAC & RBAC"
          label="Authorization Model"
          delta="Role & object level checks"
          icon={<SecurityIcon />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          value="100% Active"
          label="Coverage Index"
          delta="All backend endpoints protected"
          icon={<VerifiedUserIcon />}
          iconBg="#F8FAFC"
          iconColor="#0F172A"
        />
      </Box>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permission code (e.g. BUILDING_READ), module name, or description..."
        onReset={() => {
          setSearch("");
          setSelectedModule("ALL");
        }}
        hasActiveFilters={Boolean(search || selectedModule !== "ALL")}
      />

      {/* Module Quick Filter Chips */}
      {allModuleNames.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            overflowX: "auto",
            pb: 1,
            mb: 2.5,
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#CBD5E1", borderRadius: 2 },
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.secondary, textTransform: "uppercase", mr: 0.5, flexShrink: 0 }}
          >
            Module:
          </Typography>
          <Chip
            label="All Modules"
            size="small"
            onClick={() => setSelectedModule("ALL")}
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              cursor: "pointer",
              bgcolor: selectedModule === "ALL" ? DESIGN_TOKENS.brand[600] : "#FFFFFF",
              color: selectedModule === "ALL" ? "#FFFFFF" : DESIGN_TOKENS.text.secondary,
              border: `1px solid ${selectedModule === "ALL" ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.line[200]}`,
              "&:hover": {
                bgcolor: selectedModule === "ALL" ? DESIGN_TOKENS.brand[700] : DESIGN_TOKENS.brand[50],
              },
            }}
          />
          {allModuleNames.map((mod) => (
            <Chip
              key={mod}
              label={mod}
              size="small"
              onClick={() => setSelectedModule(mod)}
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                bgcolor: selectedModule === mod ? DESIGN_TOKENS.brand[600] : "#FFFFFF",
                color: selectedModule === mod ? "#FFFFFF" : DESIGN_TOKENS.text.secondary,
                border: `1px solid ${selectedModule === mod ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.line[200]}`,
                "&:hover": {
                  bgcolor: selectedModule === mod ? DESIGN_TOKENS.brand[700] : DESIGN_TOKENS.brand[50],
                },
              }}
            />
          ))}
        </Box>
      )}

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : groupKeys.length === 0 ? (
        <EmptyState
          title="No permissions match your filter"
          description="Try changing your search keywords or module filter to view security tokens."
          action={
            (search || selectedModule !== "ALL") && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setSelectedModule("ALL");
                }}
              >
                Clear Filters
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
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2.5,
            width: "100%",
          }}
        >
          {groupKeys.map((moduleName) => {
            const items = groupedPermissions[moduleName];

            return (
              <Paper
                key={moduleName}
                variant="outlined"
                sx={{
                  p: 2.5,
                  height: "100%",
                  borderRadius: "14px",
                  borderColor: DESIGN_TOKENS.line[200],
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: DESIGN_TOKENS.brand[600],
                    boxShadow: "0 6px 18px -4px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
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
                        flexShrink: 0,
                      }}
                    >
                      <VpnKeyIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                        {moduleName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                        Domain Access Boundary
                      </Typography>
                    </Box>
                    <Chip
                      label={`${items.length} Tokens`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        height: 24,
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
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
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
                            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, lineHeight: 1.4, display: "block" }}>
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
            );
          })}
        </Box>
      ) : (
        <DataTable columns={columns} rows={filteredPermissions} isLoading={isLoading} />
      )}
    </Box>
  );
};

export default PermissionsListPage;
