// =====================  FLOORS LIST PAGE  ====================
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
import { useFloorsList, useCreateFloorMutation } from "../../features/floors/hooks/use-floors.js";
import { useBlocksList } from "../../features/blocks/hooks/use-blocks.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const floorSchema = z.object({
  blockId: z.string().min(1, "Block / Tower is required"),
  floorNumber: z.coerce.number().min(0, "Floor number cannot be negative"),
  name: z.string().optional(),
});

export const FloorsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [blockFilter, setBlockFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: blocksData } = useBlocksList();
  const blocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(blockFilter && { blockId: blockFilter }),
  };

  const { data, isLoading } = useFloorsList(queryParams);
  const createMutation = useCreateFloorMutation();

  const floors = data?.floors || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || floors.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      blockId: "",
      floorNumber: 0,
      name: "",
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
      id: "floorNumber",
      label: "Floor Level",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>Level {val}</Box>
          {row.name && <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{row.name}</Box>}
        </Box>
      ),
    },
    {
      id: "block",
      label: "Block / Tower",
      render: (_, row) => row.block?.name || row.blockId || "-",
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Floors & Levels"
        subtitle="Manage vertical floor levels within designated towers and blocks"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Floors" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.FLOOR_CREATE}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Floor
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        onReset={() => {
          setBlockFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(blockFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filter by Block / Tower</InputLabel>
          <Select
            value={blockFilter}
            label="Filter by Block / Tower"
            onChange={(e) => {
              setBlockFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Blocks</em>
            </MenuItem>
            {blocks.map((blk) => (
              <MenuItem key={blk.id || blk._id} value={blk.id || blk._id}>
                {blk.name} ({blk.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={floors}
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

      {/* Create Floor Dialog */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Register Floor Level</DialogTitle>
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
                label="Floor Number"
                type="number"
                fullWidth
                error={Boolean(errors.floorNumber)}
                helperText={errors.floorNumber?.message}
                {...register("floorNumber")}
              />

              <TextField
                label="Floor Custom Name (Optional)"
                placeholder="e.g. Ground Floor, Penthouse Level"
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
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Floor"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default FloorsListPage;
