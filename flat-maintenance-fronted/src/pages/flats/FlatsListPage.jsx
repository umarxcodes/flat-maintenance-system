// =====================  FLATS / UNITS LIST PAGE  =============
import React, { useState, useEffect } from "react";
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
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useFlatsList,
  useCreateFlatMutation,
  useUpdateFlatStatusMutation,
} from "../../features/flats/hooks/use-flats.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useBlocksList } from "../../features/blocks/hooks/use-blocks.js";
import { useFloorsList } from "../../features/floors/hooks/use-floors.js";
import { useAuth } from "../../providers/auth-context.js";
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

const FLAT_TYPES = ["STUDIO", "1BHK", "2BHK", "3BHK", "4BHK", "PENTHOUSE", "VILLA"];

const flatSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  blockId: z.string().min(1, "Block / Tower is required"),
  floorId: z.string().min(1, "Floor level is required"),
  flatNumber: z
    .string({ required_error: "Flat / Unit number is required" })
    .trim()
    .min(1, "Flat number must be at least 1 character")
    .max(20, "Flat number cannot exceed 20 characters"),
  areaSqFt: z.coerce
    .number({ required_error: "Area in square feet is required" })
    .min(50, "Area must be at least 50 sq ft")
    .max(50000, "Area cannot exceed 50,000 sq ft"),
  flatType: z.enum(FLAT_TYPES),
  status: z.enum(Object.values(STATUSES.FLAT)).default(STATUSES.FLAT.VACANT),
});

export const FlatsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBuildingId } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusDialogFlat, setStatusDialogFlat] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // 1. Fetch Buildings
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const initialBuilding =
    searchParams.get("buildingId") ||
    activeBuildingId ||
    buildings[0]?.id ||
    buildings[0]?._id ||
    "";
  const [selectedBuilding, setSelectedBuilding] = useState(initialBuilding);

  useEffect(() => {
    if (!selectedBuilding && buildings.length > 0) {
      setSelectedBuilding(buildings[0].id || buildings[0]._id);
    }
  }, [buildings, selectedBuilding]);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(selectedBuilding && { buildingId: selectedBuilding }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { flatType: typeFilter }),
  };

  const { data, isLoading } = useFlatsList(queryParams);
  const createMutation = useCreateFlatMutation();
  const updateStatusMutation = useUpdateFlatStatusMutation();

  const flats = data?.flats || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || flats.length;

  // Client-side search filtering by flat number
  const filteredFlats = flats.filter((flat) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      String(flat.flatNumber || "").toLowerCase().includes(term) ||
      String(flat.flatType || "").toLowerCase().includes(term) ||
      String(flat.blockId?.name || "").toLowerCase().includes(term)
    );
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(flatSchema),
    defaultValues: {
      buildingId: selectedBuilding || "",
      blockId: "",
      floorId: "",
      flatNumber: "",
      areaSqFt: 850,
      flatType: "2BHK",
      status: STATUSES.FLAT.VACANT,
    },
  });

  const dialogBuildingId = useWatch({ control, name: "buildingId" });
  const dialogBlockId = useWatch({ control, name: "blockId" });

  const { data: blocksData } = useBlocksList({ buildingId: dialogBuildingId });
  const dialogBlocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);

  const { data: floorsData } = useFloorsList({ blockId: dialogBlockId });
  const dialogFloors = floorsData?.floors || (Array.isArray(floorsData) ? floorsData : []);

  const handleOpenCreate = () => {
    reset({
      buildingId: selectedBuilding || buildings[0]?.id || buildings[0]?._id || "",
      blockId: "",
      floorId: "",
      flatNumber: "",
      areaSqFt: 850,
      flatType: "2BHK",
      status: STATUSES.FLAT.VACANT,
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    const payload = {
      buildingId: values.buildingId,
      blockId: values.blockId,
      floorId: values.floorId,
      flatNumber: values.flatNumber,
      areaSqFt: Number(values.areaSqFt),
      flatType: values.flatType,
      status: values.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const handleStatusUpdateSubmit = () => {
    if (!statusDialogFlat || !newStatus) return;
    updateStatusMutation.mutate(
      { id: statusDialogFlat.id || statusDialogFlat._id, status: newStatus },
      {
        onSuccess: () => {
          setStatusDialogFlat(null);
          setNewStatus("");
        },
      }
    );
  };

  const columns = [
    {
      id: "flatNumber",
      label: "Unit / Flat No.",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>Flat {val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: DESIGN_TOKENS.text.secondary }}>
            {row.blockId?.name || row.block?.name || "Tower"} • Level{" "}
            {row.floorId?.floorNumber ?? row.floor?.floorNumber ?? "—"}
          </Box>
        </Box>
      ),
    },
    {
      id: "flatType",
      label: "Configuration",
      render: (val, row) => `${val || "—"} (${row.areaSqFt || "—"} sq ft)`,
    },
    {
      id: "status",
      label: "Occupancy Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View Flat Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/flats/${row.id || row._id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <PermissionGuard permission={PERMISSIONS.FLAT_UPDATE}>
            <Tooltip title="Update Occupancy Status">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusDialogFlat(row);
                  setNewStatus(row.status);
                }}
              >
                <EditLocationAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title="Flats & Units"
        subtitle="Manage residential unit inventory, layouts, square footage, and occupancy lifecycle"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Flats" }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              sx={{ bgcolor: "#FFFFFF" }}
            >
              <ToggleButton value="grid" aria-label="Units Grid">
                <GridViewIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="table" aria-label="Data Table">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.FLAT_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Flat Unit
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by flat number or type..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setTypeFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || typeFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="flat-bld-label">Building Complex</InputLabel>
          <Select
            labelId="flat-bld-label"
            value={selectedBuilding}
            label="Building Complex"
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBuilding(val);
              setSearchParams({ buildingId: val });
              setPage(0);
            }}
          >
            {buildings.map((b) => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Occupancy Status</InputLabel>
          <Select
            value={statusFilter}
            label="Occupancy Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            {Object.values(STATUSES.FLAT).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Unit Layout</InputLabel>
          <Select
            value={typeFilter}
            label="Unit Layout"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Types</em>
            </MenuItem>
            {FLAT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {/* Grid or Table Presentation */}
      {viewMode === "grid" ? (
        <Box sx={{ mb: 4 }}>
          {isLoading ? (
            <Grid container spacing={2.5}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}
                  >
                    <Skeleton variant="text" width="40%" height={26} />
                    <Skeleton variant="text" width="70%" height={18} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: "8px" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filteredFlats.length === 0 ? (
            <EmptyState
              title="No residential flats match your filters."
              description="Register new units or clear filter parameters to view inventory."
              action={
                <PermissionGuard permission={PERMISSIONS.FLAT_CREATE}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 600 }}
                  >
                    Add Flat Unit
                  </Button>
                </PermissionGuard>
              }
            />
          ) : (
            <Grid container spacing={2.5}>
              {filteredFlats.map((flat) => {
                const fId = flat.id || flat._id;
                const towerName = flat.blockId?.name || flat.block?.name || "Tower";
                const floorLvl = flat.floorId?.floorNumber ?? flat.floor?.floorNumber ?? "—";

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={fId}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
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
                        {/* Header: Flat No & Status */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1.5,
                          }}
                        >
                          <Typography
                            sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F172A" }}
                          >
                            Flat {flat.flatNumber}
                          </Typography>
                          <StatusChip status={flat.status} />
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{ color: DESIGN_TOKENS.text.secondary, mb: 1 }}
                        >
                          {towerName} • Level {floorLvl}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Chip
                            label={flat.flatType || "2BHK"}
                            size="small"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              bgcolor: "#EEF2FF",
                              color: DESIGN_TOKENS.brand[600],
                            }}
                          />
                          <Chip
                            label={`${flat.areaSqFt || 0} sq ft`}
                            size="small"
                            sx={{ fontSize: "0.75rem", fontWeight: 500, bgcolor: "#F1F5F9" }}
                          />
                        </Box>
                      </Box>

                      {/* Footer Actions */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pt: 1.5,
                          borderTop: "1px solid #F1F5F9",
                        }}
                      >
                        <PermissionGuard permission={PERMISSIONS.FLAT_UPDATE}>
                          <Button
                            size="small"
                            startIcon={<EditLocationAltIcon sx={{ fontSize: 15 }} />}
                            onClick={() => {
                              setStatusDialogFlat(flat);
                              setNewStatus(flat.status);
                            }}
                            sx={{ fontSize: "0.75rem", color: DESIGN_TOKENS.text.secondary }}
                          >
                            Status
                          </Button>
                        </PermissionGuard>

                        <Button
                          component={RouterLink}
                          to={`/flats/${fId}`}
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            color: DESIGN_TOKENS.brand[600],
                          }}
                        >
                          Details
                        </Button>
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
          rows={filteredFlats}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => navigate(`/flats/${row.id || row._id}`)}
        />
      )}

      {/* Create Flat Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Provision New Flat Unit
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create flat."}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                <InputLabel>Building Complex</InputLabel>
                <Select label="Building Complex" {...register("buildingId")}>
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.blockId)}>
                  <InputLabel>Block / Tower</InputLabel>
                  <Select
                    label="Block / Tower"
                    {...register("blockId")}
                    disabled={!dialogBuildingId}
                  >
                    {dialogBlocks.map((blk) => (
                      <MenuItem key={blk.id || blk._id} value={blk.id || blk._id}>
                        {blk.name} ({blk.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.floorId)}>
                  <InputLabel>Floor Level</InputLabel>
                  <Select label="Floor Level" {...register("floorId")} disabled={!dialogBlockId}>
                    {dialogFloors.map((fl) => (
                      <MenuItem key={fl.id || fl._id} value={fl.id || fl._id}>
                        Level {fl.floorNumber} {fl.name ? `(${fl.name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Flat / Unit Number"
                  placeholder="e.g. 101, 402"
                  fullWidth
                  error={Boolean(errors.flatNumber)}
                  helperText={errors.flatNumber?.message}
                  {...register("flatNumber")}
                />

                <TextField
                  label="Area (Square Feet)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 50, max: 50000 }}
                  error={Boolean(errors.areaSqFt)}
                  helperText={errors.areaSqFt?.message}
                  {...register("areaSqFt")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.flatType)}>
                  <InputLabel>Flat Type</InputLabel>
                  <Select label="Flat Type" defaultValue="2BHK" {...register("flatType")}>
                    {FLAT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Occupancy Status</InputLabel>
                  <Select
                    label="Occupancy Status"
                    defaultValue={STATUSES.FLAT.VACANT}
                    {...register("status")}
                  >
                    {Object.values(STATUSES.FLAT).map((st) => (
                      <MenuItem key={st} value={st}>
                        {st}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              {createMutation.isPending ? "Registering..." : "Register Flat"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Status Transition Dialog */}
      <Dialog
        open={Boolean(statusDialogFlat)}
        onClose={() => setStatusDialogFlat(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Update Occupancy Status
        </DialogTitle>
        <DialogContent dividers>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatusMutation.error?.message || "Failed to update status."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: DESIGN_TOKENS.text.secondary }}>
            Select operational occupancy status for Flat {statusDialogFlat?.flatNumber}:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
              {Object.values(STATUSES.FLAT).map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusDialogFlat(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdateSubmit}
            disabled={updateStatusMutation.isPending}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Confirm Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlatsListPage;
