// =====================  BLOCKS / TOWERS LIST PAGE  ===========
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
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
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBlocksList, useCreateBlockMutation } from "../../features/blocks/hooks/use-blocks.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useAuth } from "../../providers/auth-context.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

const BLOCK_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

const blockSchema = z.object({
  buildingId: z
    .string({ required_error: "Building complex is required" })
    .min(1, "Building complex is required"),
  name: z
    .string({ required_error: "Block / Tower name is required" })
    .trim()
    .min(1, "Block name must be at least 1 character")
    .max(50, "Block name cannot exceed 50 characters"),
  code: z
    .string()
    .trim()
    .max(20, "Block code cannot exceed 20 characters")
    .regex(
      BLOCK_CODE_REGEX,
      "Block code must contain only letters, numbers, hyphens, or underscores"
    )
    .optional()
    .or(z.literal("")),
  totalFloors: z.coerce
    .number({ required_error: "Total floors count is required" })
    .int("Total floors must be an integer")
    .min(1, "Total floors must be at least 1")
    .max(100, "Total floors cannot exceed 100"),
});

export const BlocksListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBuildingId } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: buildingsData, isLoading: loadingBuildings } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  // Determine initial building from query params, active building context, or first available building
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

  const { data: blocksData, isLoading: loadingBlocks } = useBlocksList({
    buildingId: selectedBuilding,
  });
  const createMutation = useCreateBlockMutation();

  const rawBlocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);

  // Filter blocks client-side by search
  const filteredBlocks = rawBlocks.filter((blk) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return blk.name?.toLowerCase().includes(term) || blk.code?.toLowerCase().includes(term);
  });

  const currentBuildingObj = buildings.find((b) => (b.id || b._id) === selectedBuilding);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      buildingId: selectedBuilding || "",
      name: "",
      code: "",
      totalFloors: 1,
    },
  });

  const handleOpenCreate = () => {
    reset({
      buildingId: selectedBuilding || buildings[0]?.id || buildings[0]?._id || "",
      name: "",
      code: "",
      totalFloors: 1,
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
      name: values.name,
      totalFloors: Number(values.totalFloors),
      ...(values.code && { code: values.code }),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const columns = [
    {
      id: "name",
      label: "Block / Tower Name",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: DESIGN_TOKENS.text.secondary }}>
            Code: {row.code || "—"}
          </Box>
        </Box>
      ),
    },
    {
      id: "building",
      label: "Building Complex",
      render: () => currentBuildingObj?.name || "Selected Complex",
    },
    {
      id: "totalFloors",
      label: "Total Floors",
      render: (val) => val ?? 1,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          component={RouterLink}
          to={`/floors?blockId=${row.id || row._id}`}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
          sx={{ fontSize: "0.8125rem", fontWeight: 600, color: DESIGN_TOKENS.brand[600] }}
        >
          View Floors
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title="Blocks & Towers"
        subtitle="Manage structural towers and sections across building complexes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Blocks" }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
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

            <PermissionGuard permission={PERMISSIONS.BLOCK_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                disabled={!selectedBuilding}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Block / Tower
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search blocks by name or code..."
        onReset={() => {
          setSearch("");
        }}
        hasActiveFilters={Boolean(search)}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="select-building-label">Building Complex</InputLabel>
          <Select
            labelId="select-building-label"
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
                {b.name} ({b.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {/* Grid or Table Presentation */}
      {viewMode === "grid" ? (
        <Box sx={{ mb: 4 }}>
          {loadingBlocks || loadingBuildings ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={40}
                      width={40}
                      sx={{ borderRadius: "10px", mb: 2 }}
                    />
                    <Skeleton variant="text" width="60%" height={26} />
                    <Skeleton variant="text" width="40%" height={18} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: "8px" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filteredBlocks.length === 0 ? (
            <EmptyState
              title="No blocks found for this building."
              description="Register new towers or structural wings to organize your properties."
              action={
                <PermissionGuard permission={PERMISSIONS.BLOCK_CREATE}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 600 }}
                  >
                    Add First Block
                  </Button>
                </PermissionGuard>
              }
            />
          ) : (
            <Grid container spacing={3}>
              {filteredBlocks.map((blk) => {
                const bId = blk.id || blk._id;
                const initials = blk.code || blk.name?.slice(0, 2).toUpperCase() || "BL";

                return (
                  <Grid item xs={12} sm={6} md={4} key={bId}>
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
                          boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.08)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box>
                        {/* Header Badge */}
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
                              bgcolor: "#EEF2FF",
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
                          <Chip
                            label={`Code: ${blk.code || "—"}`}
                            size="small"
                            sx={{ fontSize: "0.75rem", fontWeight: 600, bgcolor: "#F1F5F9" }}
                          />
                        </Box>

                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "1.0625rem",
                            fontWeight: 700,
                            color: DESIGN_TOKENS.text.primary,
                            mb: 0.5,
                          }}
                        >
                          {blk.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}
                        >
                          Complex: {currentBuildingObj?.name || "Residential Tower"}
                        </Typography>
                      </Box>

                      <Box>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            bgcolor: DESIGN_TOKENS.surface[50],
                            border: "1px solid #F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                          }}
                        >
                          <LayersOutlinedIcon
                            sx={{ color: DESIGN_TOKENS.brand[600], fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}
                            >
                              Total Floor Levels
                            </Typography>
                            <Typography
                              sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}
                            >
                              {blk.totalFloors || 1} Floors
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            component={RouterLink}
                            to={`/floors?blockId=${bId}`}
                            size="small"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              color: DESIGN_TOKENS.brand[600],
                            }}
                          >
                            Explore Floors
                          </Button>
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
          rows={filteredBlocks}
          isLoading={loadingBlocks}
          totalCount={filteredBlocks.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
        />
      )}

      {/* Create Block Dialog */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Create New Block / Tower
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create block."}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                <InputLabel>Building Complex</InputLabel>
                <Select label="Building Complex" {...register("buildingId")}>
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Block / Tower Name"
                placeholder="e.g. Tower A, West Wing"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Block Code (Optional)"
                  placeholder="e.g. T-A, BLK-01"
                  fullWidth
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message || "Letters, numbers, underscores, or hyphens"}
                  {...register("code")}
                />

                <TextField
                  label="Total Floors"
                  type="number"
                  fullWidth
                  inputProps={{ min: 1, max: 100 }}
                  error={Boolean(errors.totalFloors)}
                  helperText={errors.totalFloors?.message}
                  {...register("totalFloors")}
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
              {createMutation.isPending ? "Creating..." : "Save Block"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BlocksListPage;
