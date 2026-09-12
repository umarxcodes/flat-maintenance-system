// =====================  BLOCKS / TOWERS LIST PAGE  ===========
import React, { useState } from "react";
import Box from "@mui/material/Box";
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
import AddIcon from "@mui/icons-material/Add";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBlocksList, useCreateBlockMutation } from "../../features/blocks/hooks/use-blocks.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const blockSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  name: z.string().min(1, "Block name is required"),
  code: z.string().min(1, "Block code is required"),
  totalFloors: z.coerce.number().min(1, "Must have at least 1 floor"),
});

export const BlocksListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useBlocksList(queryParams);
  const createMutation = useCreateBlockMutation();

  const blocks = data?.blocks || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || blocks.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      buildingId: "",
      name: "",
      code: "",
      totalFloors: 1,
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
      label: "Block / Tower Name",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Code: {row.code}</Box>
        </Box>
      ),
    },
    {
      id: "building",
      label: "Building Complex",
      render: (_, row) => row.building?.name || row.buildingId || "-",
    },
    {
      id: "totalFloors",
      label: "Total Floors",
      render: (val) => val ?? "-",
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Blocks & Towers"
        subtitle="Manage structural towers and sections across building complexes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Blocks" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.BLOCK_CREATE}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Block
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
        searchPlaceholder="Search blocks by name or code..."
        onReset={() => {
          setSearch("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Building Complex</InputLabel>
          <Select
            value={buildingFilter}
            label="Building Complex"
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Buildings</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={blocks}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
      />

      {/* Create Block Dialog */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Block / Tower</DialogTitle>
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
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Block / Tower Name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <TextField
                label="Block Code"
                placeholder="e.g. BLK-A"
                fullWidth
                error={Boolean(errors.code)}
                helperText={errors.code?.message}
                {...register("code")}
              />

              <TextField
                label="Total Floors"
                type="number"
                fullWidth
                error={Boolean(errors.totalFloors)}
                helperText={errors.totalFloors?.message}
                {...register("totalFloors")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Block"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BlocksListPage;
