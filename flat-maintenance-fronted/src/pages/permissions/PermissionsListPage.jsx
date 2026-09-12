// =====================  PERMISSIONS REGISTRY PAGE  ===========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { usePermissionsList } from "../../features/permissions/hooks/use-permissions.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";

export const PermissionsListPage = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = usePermissionsList();

  // Group permissions by module prefix
  const groupedPermissions = useMemo(() => {
    const list = data?.permissions || (Array.isArray(data) ? data : []);
    const map = {};

    list.forEach((perm) => {
      const code = typeof perm === "string" ? perm : perm.code;
      const description = typeof perm === "object" ? perm.description : "";
      const moduleName = code.split("_")[0];

      if (!map[moduleName]) {
        map[moduleName] = [];
      }

      if (
        !search ||
        code.toLowerCase().includes(search.toLowerCase()) ||
        description.toLowerCase().includes(search.toLowerCase())
      ) {
        map[moduleName].push({ code, description });
      }
    });

    // Remove empty groups
    Object.keys(map).forEach((key) => {
      if (map[key].length === 0) {
        delete map[key];
      }
    });

    return map;
  }, [data, search]);

  const groupKeys = Object.keys(groupedPermissions);

  return (
    <Box>
      <PageHeader
        title="Permissions Registry"
        subtitle="Catalog of granular platform security tokens governing access across all 24 modules"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Permissions" }]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permission code or description..."
        onReset={() => setSearch("")}
        hasActiveFilters={Boolean(search)}
      />

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : groupKeys.length === 0 ? (
        <EmptyState
          title="No permissions match your search"
          description="Try modifying your search term to view platform permission tokens."
        />
      ) : (
        <Grid container spacing={3}>
          {groupKeys.map((moduleName) => {
            const items = groupedPermissions[moduleName];

            return (
              <Grid item xs={12} md={6} key={moduleName}>
                <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: "secondary.lighter",
                        color: "secondary.main",
                        display: "flex",
                      }}
                    >
                      <VpnKeyIcon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {moduleName} Module
                    </Typography>
                    <Chip
                      label={`${items.length} Tokens`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ ml: "auto" }}
                    />
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1.5}>
                    {items.map((item) => (
                      <Box
                        key={item.code}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "primary.main",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {item.code}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default PermissionsListPage;
