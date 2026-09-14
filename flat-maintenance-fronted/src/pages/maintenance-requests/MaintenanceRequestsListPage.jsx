// =====================  MAINTENANCE REQUESTS LIST PAGE  ======
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
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useMaintenanceRequestsList,
  useCreateMaintenanceRequestMutation,
  useAssignMaintenanceRequestMutation,
  useUpdateMaintenanceStatusMutation,
} from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useStaffList } from "../../features/staff/hooks/use-staff.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "CARPENTRY",
  "HVAC",
  "MASONRY",
  "CLEANING",
  "COMMON_AREA",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];
const REQUEST_STATUSES = [
  "OPEN",
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "VERIFIED",
  "CLOSED",
  "CANCELLED",
];

const requestSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
});

export const MaintenanceRequestsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignDialogRequest, setAssignDialogRequest] = useState(null);
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [statusDialogRequest, setStatusDialogRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: staffData } = useStaffList();
  const staffMembers = staffData?.staff || (Array.isArray(staffData) ? staffData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
  };

  const { data, isLoading } = useMaintenanceRequestsList(queryParams);
  const createMutation = useCreateMaintenanceRequestMutation();
  const assignMutation = useAssignMaintenanceRequestMutation();
  const updateStatusMutation = useUpdateMaintenanceStatusMutation();

  const requests = data?.requests || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || requests.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      buildingId: "",
      flatId: "",
      title: "",
      description: "",
      category: "PLUMBING",
      priority: "MEDIUM",
    },
  });

  const handleOpenCreate = () => {
    reset();
    setIsCreateOpen(true);
  };

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  const handleAssignSubmit = () => {
    if (!assignDialogRequest || !assignedStaffId) return;
    assignMutation.mutate(
      {
        id: assignDialogRequest.id || assignDialogRequest._id,
        data: { staffId: assignedStaffId },
      },
      {
        onSuccess: () => {
          setAssignDialogRequest(null);
          setAssignedStaffId("");
        },
      }
    );
  };

  const handleStatusSubmit = () => {
    if (!statusDialogRequest || !newStatus) return;
    updateStatusMutation.mutate(
      {
        id: statusDialogRequest.id || statusDialogRequest._id,
        data: { status: newStatus, notes: statusNote },
      },
      {
        onSuccess: () => {
          setStatusDialogRequest(null);
          setNewStatus("");
          setStatusNote("");
        },
      }
    );
  };

  const columns = [
    {
      id: "title",
      label: "Work Order / Title",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.category} • Flat {row.flat?.flatNumber || "Common Area"}
          </Box>
        </Box>
      ),
    },
    {
      id: "priority",
      label: "Priority",
      render: (val) => {
        const color =
          val === "EMERGENCY"
            ? "error"
            : val === "HIGH"
              ? "warning"
              : val === "MEDIUM"
                ? "info"
                : "default";
        return (
          <Chip label={val} color={color} size="small" variant="filled" sx={{ fontWeight: 700 }} />
        );
      },
    },
    {
      id: "technician",
      label: "Assigned Tech",
      render: (_, row) =>
        row.assignedStaff
          ? `${row.assignedStaff.user?.firstName} ${row.assignedStaff.user?.lastName}`
          : "Unassigned",
    },
    {
      id: "slaDeadline",
      label: "SLA Deadline",
      render: (val) => (val ? new Date(val).toLocaleString() : "-"),
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
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <PermissionGuard permission={PERMISSIONS.REQUEST_ASSIGN}>
            <Tooltip title="Assign Technician">
              <IconButton
                size="small"
                onClick={() => {
                  setAssignDialogRequest(row);
                  setAssignedStaffId(row.assignedStaffId || "");
                }}
              >
                <AssignmentIndIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.REQUEST_UPDATE}>
            <Tooltip title="Update Status">
              <IconButton
                size="small"
                onClick={() => {
                  setStatusDialogRequest(row);
                  setNewStatus(row.status);
                }}
              >
                <EditNoteIcon fontSize="small" />
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
        title="Maintenance Requests & Work Orders"
        subtitle="Manage resident helpdesk tickets, technician dispatches, SLA tracking, and ticket lifecycles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Maintenance Requests" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.REQUEST_CREATE}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Raise Ticket
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
        searchPlaceholder="Search tickets by title..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setPriorityFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || priorityFilter)}
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
            {REQUEST_STATUSES.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Priorities</em>
            </MenuItem>
            {PRIORITIES.map((pr) => (
              <MenuItem key={pr} value={pr}>
                {pr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={requests}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        emptyTitle="No open work orders."
      />

      {/* Create Request Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Raise Maintenance Work Order</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create maintenance request."}
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
                label="Flat ID (Optional if common area)"
                placeholder="Flat ObjectId"
                fullWidth
                error={Boolean(errors.flatId)}
                helperText={errors.flatId?.message}
                {...register("flatId")}
              />

              <TextField
                label="Issue Title"
                placeholder="e.g. Master bathroom tap leaking"
                fullWidth
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Trade Category</InputLabel>
                  <Select label="Trade Category" defaultValue="PLUMBING" {...register("category")}>
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.priority)}>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" defaultValue="MEDIUM" {...register("priority")}>
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Detailed Description"
                multiline
                rows={3}
                fullWidth
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
                {...register("description")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsCreateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Assign Technician Modal */}
      <Dialog
        open={Boolean(assignDialogRequest)}
        onClose={() => setAssignDialogRequest(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Dispatch Technician</DialogTitle>
        <DialogContent dividers>
          {assignMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {assignMutation.error?.message || "Failed to assign technician."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2 }}>
            Assign an on-duty staff specialist to ticket: {assignDialogRequest?.title}
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Staff Technician</InputLabel>
            <Select
              value={assignedStaffId}
              label="Staff Technician"
              onChange={(e) => setAssignedStaffId(e.target.value)}
            >
              {staffMembers.map((s) => (
                <MenuItem key={s.id || s._id} value={s.id || s._id}>
                  {s.user?.firstName} {s.user?.lastName} ({s.subcategory || s.category})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setAssignDialogRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignSubmit}
            disabled={assignMutation.isPending || !assignedStaffId}
          >
            {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog
        open={Boolean(statusDialogRequest)}
        onClose={() => setStatusDialogRequest(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Update Work Order Status</DialogTitle>
        <DialogContent dividers>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatusMutation.error?.message || "Failed to update work order status."}
            </Alert>
          )}

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {REQUEST_STATUSES.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Work Progress / Resolution Notes"
              multiline
              rows={2}
              fullWidth
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setStatusDialogRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusSubmit}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceRequestsListPage;
