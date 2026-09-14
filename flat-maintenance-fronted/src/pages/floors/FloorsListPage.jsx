// =====================  FLOORS LIST PAGE  ====================
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
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFloorsList, useCreateFloorMutation } from "../../features/floors/hooks/use-floors.js";
import { useBlocksList } from "../../features/blocks/hooks/use-blocks.js";
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

const floorSchema = z.object({
  blockId: z
    .string({ required_error: "Block / Tower is required" })
    .min(1, "Block / Tower is required"),
  floorNumber: z.coerce
    .number({ required_error: "Floor level is required" })
    .int("Floor level must be an integer")
    .min(-5, "Floor level cannot be below -5")
    .max(100, "Floor level cannot exceed 100"),
  name: z
    .string()
    .trim()
    .max(100, "Name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
});

export const FloorsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBuildingId } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 1. Fetch Buildings
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const initialBuilding = activeBuildingId || buildings[0]?.id || buildings[0]?._id || "";
  const [selectedBuilding, setSelectedBuilding] = useState(initialBuilding);

  useEffect(() => {
    if (!selectedBuilding && buildings.length > 0) {
      setSelectedBuilding(buildings[0].id || buildings[0]._id);
    }
  }, [buildings, selectedBuilding]);

  // 2. Fetch Blocks in selected building
  const { data: blocksData, isLoading: loadingBlocks } = useBlocksList({
    buildingId: selectedBuilding,
  });
  const blocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);

  const paramBlockId = searchParams.get("blockId");
  const initialBlock = paramBlockId || blocks[0]?.id || blocks[0]?._id || "";
  const [selectedBlock, setSelectedBlock] = useState(initialBlock);

  useEffect(() => {
    if (paramBlockId) {
      setSelectedBlock(paramBlockId);
    } else if (blocks.length > 0 && !blocks.some((b) => (b.id || b._id) === selectedBlock)) {
      setSelectedBlock(blocks[0].id || blocks[0]._id);
    }
  }, [blocks, paramBlockId, selectedBlock]);

  // 3. Fetch Floors in selected block
  const { data: floorsData, isLoading: loadingFloors } = useFloorsList({
    blockId: selectedBlock,
  });
  const createMutation = useCreateFloorMutation();

  const rawFloors = floorsData?.floors || (Array.isArray(floorsData) ? floorsData : []);

  // Filter floors client-side by search term
  const filteredFloors = rawFloors.filter((fl) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return fl.name?.toLowerCase().includes(term) || String(fl.floorNumber).includes(term);
  });

  const currentBlockObj = blocks.find((b) => (b.id || b._id) === selectedBlock);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      blockId: selectedBlock || "",
      floorNumber: 1,
      name: "",
    },
  });

  const handleOpenCreate = () => {
    reset({
      blockId: selectedBlock || blocks[0]?.id || blocks[0]?._id || "",
      floorNumber: rawFloors.length > 0 ? Math.max(...rawFloors.map((f) => f.floorNumber)) + 1 : 1,
      name: "",
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    const payload = {
      blockId: values.blockId,
      floorNumber: Number(values.floorNumber),
      ...(values.name && { name: values.name }),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const columns = [
    {
      id: "floorNumber",
      label: "Floor Level",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
            Level {val} {val === 0 ? "(Ground)" : val < 0 ? `(Basement ${Math.abs(val)})` : ""}
          </Box>
          {row.name && (
            <Box sx={{ fontSize: "0.75rem", color: DESIGN_TOKENS.text.secondary }}>{row.name}</Box>
          )}
        </Box>
      ),
    },
    {
      id: "block",
      label: "Block / Tower",
      render: () => currentBlockObj?.name || "Selected Tower",
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          component={RouterLink}
          to={`/flats?floorId=${row.id || row._id}`}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
          sx={{ fontSize: "0.8125rem", fontWeight: 600, color: DESIGN_TOKENS.brand[600] }}
        >
          View Units
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title="Floors & Levels"
        subtitle="Manage vertical floor levels within designated towers and blocks"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Floors" }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              sx={{ bgcolor: "#FFFFFF" }}
            >
              <ToggleButton value="grid" aria-label="Floor Grid">
                <GridViewIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="table" aria-label="Data Table">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.FLOOR_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                disabled={!selectedBlock}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Floor Level
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Filter Bar: Select Building & Select Block */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search floor name or level number..."
        onReset={() => {
          setSearch("");
        }}
        hasActiveFilters={Boolean(search)}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="floor-bld-label">Building Complex</InputLabel>
          <Select
            labelId="floor-bld-label"
            value={selectedBuilding}
            label="Building Complex"
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBuilding(val);
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

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="floor-blk-label">Block / Tower</InputLabel>
          <Select
            labelId="floor-blk-label"
            value={selectedBlock}
            label="Block / Tower"
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBlock(val);
              setSearchParams({ blockId: val });
              setPage(0);
            }}
            disabled={blocks.length === 0}
          >
            {blocks.map((blk) => (
              <MenuItem key={blk.id || blk._id} value={blk.id || blk._id}>
                {blk.name} ({blk.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {/* Grid or Table Presentation */}
      {viewMode === "grid" ? (
        <Box sx={{ mb: 4 }}>
          {loadingFloors ? (
            <Grid container spacing={2.5}>
              {[1, 2, 3, 4].map((idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}
                  >
                    <Skeleton variant="text" width="50%" height={28} />
                    <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: "8px" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filteredFloors.length === 0 ? (
            <EmptyState
              title={
                selectedBlock
                  ? "No floors registered for this tower."
                  : "Please select a block to view its floor levels."
              }
              description="Register new floor levels to configure flat allocations and unit directories."
              action={
                selectedBlock ? (
                  <PermissionGuard permission={PERMISSIONS.FLOOR_CREATE}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreate}
                      sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 600 }}
                    >
                      Register First Floor Level
                    </Button>
                  </PermissionGuard>
                ) : null
              }
            />
          ) : (
            <Grid container spacing={2.5}>
              {filteredFloors.map((fl) => {
                const fId = fl.id || fl._id;
                const lvl = fl.floorNumber;

                return (
                  <Grid item xs={12} sm={6} md={3} key={fId}>
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
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "8px",
                              bgcolor: "#EEF2FF",
                              color: DESIGN_TOKENS.brand[600],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                            }}
                          >
                            L{lvl}
                          </Box>
                          <Chip
                            label={currentBlockObj?.name || "Tower"}
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
                          Level {lvl}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: DESIGN_TOKENS.text.secondary,
                            fontSize: "0.8125rem",
                            minHeight: 20,
                            mb: 2,
                          }}
                        >
                          {fl.name || "Standard Floor Level"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          pt: 1,
                          borderTop: "1px solid #F1F5F9",
                        }}
                      >
                        <Button
                          component={RouterLink}
                          to={`/flats?floorId=${fId}`}
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            color: DESIGN_TOKENS.brand[600],
                          }}
                        >
                          View Flats
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
          rows={filteredFloors}
          isLoading={loadingFloors}
          totalCount={filteredFloors.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
        />
      )}

      {/* Create Floor Dialog */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Register New Floor Level
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create floor level."}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small" error={Boolean(errors.blockId)}>
                <InputLabel>Block / Tower</InputLabel>
                <Select label="Block / Tower" {...register("blockId")}>
                  {blocks.map((blk) => (
                    <MenuItem key={blk.id || blk._id} value={blk.id || blk._id}>
                      {blk.name} ({blk.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Floor Level Number"
                type="number"
                placeholder="e.g. 1, 2 (0 for ground, negative for basements)"
                fullWidth
                inputProps={{ min: -5, max: 100 }}
                error={Boolean(errors.floorNumber)}
                helperText={errors.floorNumber?.message}
                {...register("floorNumber")}
              />

              <TextField
                label="Custom Floor Title (Optional)"
                placeholder="e.g. Ground Suites, Penthouse Level"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />
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
              {createMutation.isPending ? "Creating..." : "Save Floor Level"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default FloorsListPage;
