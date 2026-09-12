// =====================  COMPLAINTS & GRIEVANCES PAGE  =======
import React, { useState } from "react";
import Box from "@mui/material/Box";
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
import Typography from "@mui/material/Typography";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useComplaintsList,
  useCreateComplaintMutation,
  useResolveComplaintMutation,
} from "../../features/complaints/hooks/use-complaints.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const COMPLAINT_TYPES = [
  "NOISE_DISTURBANCE",
  "PARKING_DISPUTE",
  "SECURITY_BREACH",
  "SANITATION",
  "SOCIETY_RULE_VIOLATION",
  "OTHER",
];

const complaintSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  complaintType: z.string().min(1, "Complaint type is required"),
});

export const ComplaintsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resolveDialogComplaint, setResolveDialogComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { complaintType: typeFilter }),
  };

  const { data, isLoading } = useComplaintsList(queryParams);
  const createMutation = useCreateComplaintMutation();
  const resolveMutation = useResolveComplaintMutation();

  const complaints = data?.complaints || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || complaints.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      buildingId: "",
      flatId: "",
      title: "",
      description: "",
      complaintType: "NOISE_DISTURBANCE",
    },
  });

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      },
    });
  };

  const handleResolveSubmit = () => {
    if (!resolveDialogComplaint || !resolutionNotes) return;
    resolveMutation.mutate(
      {
        id: resolveDialogComplaint.id || resolveDialogComplaint._id,
        data: { resolutionNotes },
      },
      {
        onSuccess: () => {
          setResolveDialogComplaint(null);
          setResolutionNotes("");
        },
      }
    );
  };

  const columns = [
    {
      id: "title",
      label: "Grievance / Subject",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.complaintType} • Flat {row.flat?.flatNumber || "Common"}
          </Box>
        </Box>
      ),
    },
    {
      id: "submittedBy",
      label: "Complainant",
      render: (_, row) =>
        row.creator ? `${row.creator.firstName} ${row.creator.lastName}` : "Resident",
    },
    {
      id: "createdAt",
      label: "Date Logged",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
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
        <PermissionGuard permission={PERMISSIONS.COMPLAINT_RESOLVE}>
          {row.status !== "RESOLVED" && row.status !== "REJECTED" && (
            <Tooltip title="Resolve Grievance">
              <IconButton
                size="small"
                color="success"
                onClick={() => {
                  setResolveDialogComplaint(row);
                  setResolutionNotes("");
                }}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Society Complaints & Grievances"
        subtitle="Review community disputes, noise disturbances, rule violations, and resolution notes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Complaints" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.COMPLAINT_CREATE}>
            <Button
              variant="contained"
              startIcon={<ReportProblemIcon />}
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
            >
              File Complaint
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
        searchPlaceholder="Search complaints by title..."
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
            {Object.values(STATUSES.COMPLAINT).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Grievance Type</InputLabel>
          <Select
            value={typeFilter}
            label="Grievance Type"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Types</em>
            </MenuItem>
            {COMPLAINT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={complaints}
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

      {/* File Complaint Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>File Society Complaint</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to file complaint."}
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
                label="Flat Unit ID (Optional)"
                placeholder="Related Flat ObjectId"
                fullWidth
                error={Boolean(errors.flatId)}
                helperText={errors.flatId?.message}
                {...register("flatId")}
              />

              <TextField
                label="Grievance Title / Subject"
                placeholder="e.g. Excessive noise after 11 PM"
                fullWidth
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <FormControl fullWidth size="small" error={Boolean(errors.complaintType)}>
                <InputLabel>Grievance Type</InputLabel>
                <Select label="Grievance Type" defaultValue="NOISE_DISTURBANCE" {...register("complaintType")}>
                  {COMPLAINT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Detailed Description & Evidence Notes"
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
              {createMutation.isPending ? "Submitting..." : "Submit Complaint"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Resolve Complaint Modal */}
      <Dialog
        open={Boolean(resolveDialogComplaint)}
        onClose={() => setResolveDialogComplaint(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Resolve Complaint</DialogTitle>
        <DialogContent dividers>
          {resolveMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resolveMutation.error?.message || "Failed to resolve complaint."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2 }}>
            Provide formal resolution summary for: {resolveDialogComplaint?.title}
          </Typography>

          <TextField
            label="Resolution Notes & Corrective Actions"
            multiline
            rows={3}
            fullWidth
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setResolveDialogComplaint(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolveSubmit}
            disabled={resolveMutation.isPending || !resolutionNotes}
          >
            {resolveMutation.isPending ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplaintsListPage;
