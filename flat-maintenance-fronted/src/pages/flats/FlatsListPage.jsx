// =====================  FLATS / UNITS LIST PAGE  =============
import React, { useState } from "react";
import Box from "@mui/material/Box";
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
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFlatsList, useCreateFlatMutation, useUpdateFlatStatusMutation } from "../../features/flats/hooks/use-flats.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useBlocksList } from "../../features/blocks/hooks/use-blocks.js";
import { useFloorsList } from "../../features/floors/hooks/use-floors.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const FLAT_TYPES = ["1BHK", "2BHK", "3BHK", "4BHK", "PENTHOUSE", "STUDIO"];

const flatSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  blockId: z.string().min(1, "Block is required"),
  floorId: z.string().min(1, "Floor is required"),
  flatNumber: z.string().min(1, "Flat number is required"),
  areaSqFt: z.coerce.number().positive("Area must be positive"),
  flatType: z.enum(["1BHK", "2BHK", "3BHK", "4BHK", "PENTHOUSE", "STUDIO"]),
});

export const FlatsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusDialogFlat, setStatusDialogFlat] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { flatType: typeFilter }),
  };

  const { data, isLoading } = useFlatsList(queryParams);
  const createMutation = useCreateFlatMutation();
  const updateStatusMutation = useUpdateFlatStatusMutation();

  const flats = data?.flats || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || flats.length;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(flatSchema),
    defaultValues: {
      buildingId: "",
      blockId: "",
      floorId: "",
      flatNumber: "",
      areaSqFt: 850,
      flatType: "2BHK",
    },
  });

  const selectedBuildingId = watch("buildingId");
  const selectedBlockId = watch("blockId");

  const { data: blocksData } = useBlocksList({ buildingId: selectedBuildingId });
  const blocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);

  const { data: floorsData } = useFloorsList({ blockId: selectedBlockId });
  const floors = floorsData?.floors || (Array.isArray(floorsData) ? floorsData : []);

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
          <Box sx={{ fontWeight: 700 }}>Flat {val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.block?.name || "Block"} • Level {row.floor?.floorNumber ?? "-"}
          </Box>
        </Box>
      ),
    },
    {
      id: "building",
      label: "Building Complex",
      render: (_, row) => row.building?.name || row.buildingId || "-",
    },
    {
      id: "flatType",
      label: "Configuration",
      render: (val, row) => `${val} (${row.areaSqFt} sq ft)`,
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
    <Box>
      <PageHeader
        title="Flats & Units"
        subtitle="Manage residential unit inventory, layouts, square footage, and occupancy lifecycle"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Flats" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.FLAT_CREATE}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Flat
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search by flat number..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setTypeFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || typeFilter)}
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
            {Object.values(STATUSES.FLAT).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
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

      <DataTable
        columns={columns}
        rows={flats}
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

      {/* Create Flat Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Provision New Flat Unit</DialogTitle>
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
                  <Select label="Block / Tower" {...register("blockId")} disabled={!selectedBuildingId}>
                    {blocks.map((blk) => (
                      <MenuItem key={blk.id || blk._id} value={blk.id || blk._id}>
                        {blk.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.floorId)}>
                  <InputLabel>Floor Level</InputLabel>
                  <Select label="Floor Level" {...register("floorId")} disabled={!selectedBlockId}>
                    {floors.map((fl) => (
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
                  placeholder="e.g. 402, A-101"
                  fullWidth
                  error={Boolean(errors.flatNumber)}
                  helperText={errors.flatNumber?.message}
                  {...register("flatNumber")}
                />

                <TextField
                  label="Area (Square Feet)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.areaSqFt)}
                  helperText={errors.areaSqFt?.message}
                  {...register("areaSqFt")}
                />
              </Stack>

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
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Flat"}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Update Occupancy Status</DialogTitle>
        <DialogContent dividers>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatusMutation.error?.message || "Failed to update status."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2 }}>
            Select new operational occupancy status for Flat {statusDialogFlat?.flatNumber}:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {Object.values(STATUSES.FLAT).map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setStatusDialogFlat(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdateSubmit}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlatsListPage;
