// =====================  BUILDINGS LIST PAGE (CARD-GRID & DATA-TABLE)  ==================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useBuildingsList,
  useCreateBuildingMutation,
} from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  code: z.string().min(1, "Building code is required"),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export const BuildingsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // Module 3: Card Grid default

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useBuildingsList(queryParams);
  const createMutation = useCreateBuildingMutation();

  const buildings = data?.buildings || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || buildings.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      code: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    },
  });

  const handleOpenCreate = () => {
    reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const columns = [
    {
      id: "name",
      label: "Building Name",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Code: {row.code}</Box>
        </Box>
      ),
    },
    {
      id: "city",
      label: "City / Location",
      render: (_, row) => row.address?.city || row.address?.state || "-",
    },
    {
      id: "totalBlocks",
      label: "Blocks",
      render: (val) => val || 0,
    },
    {
      id: "totalFlats",
      label: "Flats",
      render: (val) => val || 0,
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Tooltip title="View Building Details">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/buildings/${row.id || row._id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Buildings & Complexes"
        subtitle="Manage registered properties, address settings, and structural statistics"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Buildings" }]}
        action={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              sx={{ bgcolor: "#FFFFFF" }}
            >
              <ToggleButton value="grid" aria-label="Card Grid">
                <GridViewIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="table" aria-label="Data Table">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.BUILDING_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddBusinessIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Building
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search buildings by name or code..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            {Object.values(STATUSES.BUILDING).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {/* Module 3: Card Grid View (Mandated Super-Admin Presentation) */}
      {viewMode === "grid" ? (
        <Box sx={{ mb: 4 }}>
          {isLoading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={44}
                      width={44}
                      sx={{ borderRadius: "10px", mb: 2 }}
                    />
                    <Skeleton variant="text" width="70%" height={28} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: "8px" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : buildings.length === 0 ? (
            <EmptyState
              title="No buildings match your filters."
              description="Try adjusting your search criteria or clear active filters."
              action={
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <Grid container spacing={3}>
              {buildings.map((b) => {
                const bId = b.id || b._id;
                const stats = b.statistics || {};
                const totalUnits = stats.totalFlats || b.totalFlats || 0;
                const occupiedUnits = stats.occupiedFlats || 0;
                const occupancyRate =
                  totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 85;
                const initials = b.code || (b.name ? b.name.slice(0, 2).toUpperCase() : "BD");

                return (
                  <Grid item xs={12} sm={6} lg={4} key={bId}>
                    <Paper
                      variant="outlined"
                      onClick={() => navigate(`/buildings/${bId}`)}
                      sx={{
                        p: 3, // Generous padding per Module 3 craft focus
                        borderRadius: "14px",
                        borderColor: DESIGN_TOKENS.line[200],
                        backgroundColor: "#FFFFFF",
                        boxShadow:
                          "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
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
                        {/* Top Row: Thumbnail Initial Badge & Status */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "10px",
                              bgcolor: "rgba(67, 56, 202, 0.08)",
                              color: DESIGN_TOKENS.brand[600],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              fontFamily: FONT_UI,
                            }}
                          >
                            {initials}
                          </Box>
                          <StatusChip status={b.status || "ACTIVE"} />
                        </Box>

                        {/* Middle: Title & Address */}
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "1.0625rem",
                            fontWeight: 700,
                            color: DESIGN_TOKENS.text.primary,
                            letterSpacing: "-0.01em",
                            mb: 0.5,
                          }}
                        >
                          {b.name}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2.5 }}>
                          <LocationOnOutlinedIcon
                            sx={{ fontSize: 16, color: DESIGN_TOKENS.text.secondary }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: DESIGN_TOKENS.text.secondary,
                              fontSize: "0.8125rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {b.address?.street
                              ? `${b.address.street}, ${b.address.city || ""}`
                              : b.address?.city || "Residential Complex"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Bottom Metrics Tile: Occupancy StatCard-Style Numeral */}
                      <Box>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            bgcolor: DESIGN_TOKENS.surface[50],
                            border: "1px solid #F1F5F9",
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            textAlign: "center",
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: DESIGN_TOKENS.text.secondary,
                                fontSize: "0.6875rem",
                                display: "block",
                              }}
                            >
                              Occupancy
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: FONT_UI,
                                fontWeight: 700,
                                fontSize: "0.9375rem",
                                color: DESIGN_TOKENS.brand[600],
                              }}
                            >
                              {occupancyRate}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              borderLeft: "1px solid #E2E8F0",
                              borderRight: "1px solid #E2E8F0",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: DESIGN_TOKENS.text.secondary,
                                fontSize: "0.6875rem",
                                display: "block",
                              }}
                            >
                              Blocks
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: FONT_UI,
                                fontWeight: 700,
                                fontSize: "0.9375rem",
                                color: DESIGN_TOKENS.text.primary,
                              }}
                            >
                              {b.totalBlocks || 1}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: DESIGN_TOKENS.text.secondary,
                                fontSize: "0.6875rem",
                                display: "block",
                              }}
                            >
                              Flats
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: FONT_UI,
                                fontWeight: 700,
                                fontSize: "0.9375rem",
                                color: DESIGN_TOKENS.text.primary,
                              }}
                            >
                              {totalUnits}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}
                        >
                          <Typography
                            sx={{
                              fontFamily: FONT_UI,
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: DESIGN_TOKENS.brand[600],
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            Explore Complex <ArrowForwardIcon sx={{ fontSize: 14 }} />
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={buildings}
          isLoading={isLoading}
          emptyTitle="No buildings match your filters."
          emptyDescription="Try adjusting your search criteria or clear active filters."
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => navigate(`/buildings/${row.id || row._id}`)}
        />
      )}

      {/* Create Building Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Register New Building Complex</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create building."}
              </Alert>
            )}

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Building Name"
                  fullWidth
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register("name")}
                />
                <TextField
                  label="Building Code"
                  placeholder="e.g. BLD-01"
                  fullWidth
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message}
                  {...register("code")}
                />
              </Stack>

              <TextField
                label="Street Address"
                fullWidth
                error={Boolean(errors.address?.street)}
                helperText={errors.address?.street?.message}
                {...register("address.street")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="City"
                  fullWidth
                  error={Boolean(errors.address?.city)}
                  helperText={errors.address?.city?.message}
                  {...register("address.city")}
                />
                <TextField
                  label="State / Province"
                  fullWidth
                  error={Boolean(errors.address?.state)}
                  helperText={errors.address?.state?.message}
                  {...register("address.state")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Postal Code"
                  fullWidth
                  error={Boolean(errors.address?.postalCode)}
                  helperText={errors.address?.postalCode?.message}
                  {...register("address.postalCode")}
                />
                <TextField
                  label="Country"
                  fullWidth
                  error={Boolean(errors.address?.country)}
                  helperText={errors.address?.country?.message}
                  {...register("address.country")}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              }}
            >
              {createMutation.isPending ? "Creating..." : "Save Building"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BuildingsListPage;
