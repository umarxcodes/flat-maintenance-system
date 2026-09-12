// =====================  STAFF DIRECTORY LIST PAGE  ===========
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
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStaffList, useCreateStaffMutation } from "../../features/staff/hooks/use-staff.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const CATEGORIES = ["MAINTENANCE", "SECURITY", "ADMINISTRATION", "CLEANING"];
const SUBCATEGORIES = [
  "PLUMBER",
  "ELECTRICIAN",
  "HVAC_TECH",
  "HANDYMAN",
  "GATE_GUARD",
  "LOBBY_GUARD",
  "CLEANER",
];
const SHIFTS = ["MORNING", "EVENING", "NIGHT", "ROTATIONAL"];

const staffSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  buildingId: z.string().min(1, "Building complex is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Trade subcategory is required"),
  designation: z.string().min(1, "Designation is required"),
  shift: z.string().min(1, "Shift is required"),
});

export const StaffListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(shiftFilter && { shift: shiftFilter }),
  };

  const { data, isLoading } = useStaffList(queryParams);
  const createMutation = useCreateStaffMutation();

  const staff = data?.staff || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || staff.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      category: "MAINTENANCE",
      subcategory: "PLUMBER",
      designation: "Senior Technician",
      shift: "MORNING",
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
      label: "Staff Member",
      render: (_, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>
            {row.user?.firstName} {row.user?.lastName}
          </Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{row.designation}</Box>
        </Box>
      ),
    },
    {
      id: "trade",
      label: "Trade & Category",
      render: (_, row) => `${row.category} • ${row.subcategory}`,
    },
    {
      id: "shift",
      label: "Work Shift",
      render: (val) => val || "MORNING",
    },
    {
      id: "rating",
      label: "Performance Rating",
      render: (_, row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Rating value={row.averageRating || 5} precision={0.5} size="small" readOnly />
          <Typography variant="caption" color="text.secondary">
            ({row.totalRatings || 0})
          </Typography>
        </Stack>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val || "ACTIVE"} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Staff & Operations Crew"
        subtitle="Manage on-site technicians, security guards, cleaning staff, shifts, and ratings"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Staff" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.STAFF_CREATE}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>
              Onboard Staff
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
        searchPlaceholder="Search staff by designation..."
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
          setShiftFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || categoryFilter || shiftFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Shift</InputLabel>
          <Select
            value={shiftFilter}
            label="Shift"
            onChange={(e) => {
              setShiftFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Shifts</em>
            </MenuItem>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={staff}
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

      {/* Onboard Staff Dialog */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Onboard Staff Personnel</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to onboard staff."}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                label="User ID (Account Reference)"
                placeholder="Registered User ID"
                fullWidth
                error={Boolean(errors.userId)}
                helperText={errors.userId?.message}
                {...register("userId")}
              />

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
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" defaultValue="MAINTENANCE" {...register("category")}>
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.subcategory)}>
                  <InputLabel>Trade Subcategory</InputLabel>
                  <Select label="Trade Subcategory" defaultValue="PLUMBER" {...register("subcategory")}>
                    {SUBCATEGORIES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Designation / Role"
                  fullWidth
                  error={Boolean(errors.designation)}
                  helperText={errors.designation?.message}
                  {...register("designation")}
                />

                <FormControl fullWidth size="small" error={Boolean(errors.shift)}>
                  <InputLabel>Shift</InputLabel>
                  <Select label="Shift" defaultValue="MORNING" {...register("shift")}>
                    {SHIFTS.map((sh) => (
                      <MenuItem key={sh} value={sh}>
                        {sh}
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
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Onboarding..." : "Onboard Staff"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default StaffListPage;
