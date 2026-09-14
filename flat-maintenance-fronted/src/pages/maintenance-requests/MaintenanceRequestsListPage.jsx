// =====================  MAINTENANCE REQUESTS LIST PAGE  ======
import React, { useState, useMemo } from "react";
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
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useMaintenanceRequestsList,
  useCreateMaintenanceRequestMutation,
  useAssignMaintenanceRequestMutation,
  useUpdateMaintenanceStatusMutation,
  useVerifyMaintenanceRequestMutation,
} from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useStaffList } from "../../features/staff/hooks/use-staff.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

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

const SLA_HOURS = {
  EMERGENCY: "4 Hours SLA",
  HIGH: "24 Hours SLA",
  MEDIUM: "48 Hours SLA",
  LOW: "72 Hours SLA",
};

const TRADE_COMPATIBILITY_MAP = {
  PLUMBING: ["PLUMBER"],
  ELECTRICAL: ["ELECTRICIAN"],
  HVAC: ["HVAC_TECH"],
  CARPENTRY: ["HANDYMAN"],
  MASONRY: ["HANDYMAN"],
  CLEANING: ["CLEANER"],
  COMMON_AREA: ["HANDYMAN", "CLEANER", "PLUMBER", "ELECTRICIAN", "HVAC_TECH"],
};

const requestFormSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().min(1, "Flat unit is required"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Category is required" }) }),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  initialPhotos: z.array(z.string()).default([]),
});

export const MaintenanceRequestsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignDialogRequest, setAssignDialogRequest] = useState(null);
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [statusDialogRequest, setStatusDialogRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");
  const [completionPhoto, setCompletionPhoto] = useState("");
  const [verifyDialogRequest, setVerifyDialogRequest] = useState(null);
  const [verifyApproved, setVerifyApproved] = useState(true);
  const [verifyFeedback, setVerifyFeedback] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: staffData } = useStaffList({ limit: 100 });
  const staffMembers = staffData?.staff || (Array.isArray(staffData) ? staffData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useMaintenanceRequestsList(queryParams);
  const createMutation = useCreateMaintenanceRequestMutation();
  const assignMutation = useAssignMaintenanceRequestMutation();
  const updateStatusMutation = useUpdateMaintenanceStatusMutation();
  const verifyMutation = useVerifyMaintenanceRequestMutation();

  const rawRequests = data?.requests || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawRequests.length;

  const filteredRequests = useMemo(() => {
    if (!search) return rawRequests;
    const q = search.toLowerCase();
    return rawRequests.filter((r) => {
      const title = (r.title || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const cat = (r.category || "").toLowerCase();
      const ticketId = (r.ticketNumber || r.id || r._id || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || cat.includes(q) || ticketId.includes(q);
    });
  }, [rawRequests, search]);

  // Metrics
  const openCount = useMemo(() => rawRequests.filter((r) => ["OPEN", "TRIAGED"].includes(r.status)).length, [rawRequests]);
  const inProgressCount = useMemo(() => rawRequests.filter((r) => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length, [rawRequests]);
  const emergencyCount = useMemo(() => rawRequests.filter((r) => r.priority === "EMERGENCY").length, [rawRequests]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      buildingId: "",
      flatId: "",
      category: "PLUMBING",
      priority: "MEDIUM",
      title: "",
      description: "",
      initialPhotos: [],
    },
  });

  const selectedBuildingId = watch("buildingId");
  const { data: flatsData } = useFlatsList(
    selectedBuildingId ? { buildingId: selectedBuildingId, limit: 100 } : {}
  );
  const availableFlats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);

  const handleOpenCreate = () => {
    reset({
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
      flatId: "",
      category: "PLUMBING",
      priority: "MEDIUM",
      title: "",
      description: "",
      initialPhotos: [],
    });
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
        data: { assignedStaffId },
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
    if (!statusDialogRequest) return;
    const payload = {
      status: newStatus,
      ...(newStatus === "COMPLETED" && completionPhoto ? { completionPhotos: [completionPhoto] } : {}),
    };

    updateStatusMutation.mutate(
      {
        id: statusDialogRequest.id || statusDialogRequest._id,
        data: payload,
      },
      {
        onSuccess: () => {
          setStatusDialogRequest(null);
          setCompletionPhoto("");
        },
      }
    );
  };

  const handleVerifySubmit = () => {
    if (!verifyDialogRequest) return;
    verifyMutation.mutate(
      {
        id: verifyDialogRequest.id || verifyDialogRequest._id,
        data: {
          approved: verifyApproved,
          ...(verifyFeedback ? { feedback: verifyFeedback } : {}),
        },
      },
      {
        onSuccess: () => {
          setVerifyDialogRequest(null);
          setVerifyFeedback("");
        },
      }
    );
  };

  // Eligible technicians for selected request
  const eligibleStaff = useMemo(() => {
    if (!assignDialogRequest) return staffMembers;
    const allowedTrades = TRADE_COMPATIBILITY_MAP[assignDialogRequest.category] || [];
    return staffMembers.filter((s) => {
      if (s.category === "ADMINISTRATION") return false;
      if (allowedTrades.length === 0) return true;
      return allowedTrades.includes(s.subCategory);
    });
  }, [assignDialogRequest, staffMembers]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "EMERGENCY":
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
      case "HIGH":
        return { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" };
      case "MEDIUM":
        return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
      default:
        return { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" };
    }
  };

  const columns = [
    {
      id: "title",
      label: "Work Order Ticket",
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
            {row.title}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Ticket #{row.ticketNumber || (row.id || row._id).slice(-6).toUpperCase()} • {row.category}
          </Typography>
        </Box>
      ),
    },
    {
      id: "flat",
      label: "Unit & Complex",
      render: (_, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.brand[600] }}>
            Flat {row.flat?.flatNumber || row.flatId || "-"}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            {row.building?.name || "Greenwood Valley"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "priority",
      label: "Priority & SLA",
      render: (val) => {
        const pStyle = getPriorityColor(val);
        return (
          <Tooltip title={SLA_HOURS[val] || "Standard SLA"}>
            <Chip
              label={`${val} • ${SLA_HOURS[val]?.split(" ")[0] || "48h"}`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                bgcolor: pStyle.bg,
                color: pStyle.text,
                border: `1px solid ${pStyle.border}`,
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      id: "technician",
      label: "Assigned Staff",
      render: (_, row) =>
        row.assignedStaff ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: DESIGN_TOKENS.brand[600] }}>
              {row.assignedStaff?.user?.firstName?.[0] || "T"}
            </Avatar>
            <Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              {row.assignedStaff?.user?.firstName} {row.assignedStaff?.user?.lastName}
            </Typography>
          </Stack>
        ) : (
          <Chip label="Unassigned" size="small" variant="outlined" sx={{ color: DESIGN_TOKENS.text.secondary }} />
        ),
    },
    {
      id: "status",
      label: "Lifecycle Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedRequest(row)}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: DESIGN_TOKENS.line[200],
              color: DESIGN_TOKENS.brand[600],
              "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
            }}
          >
            Details
          </Button>

          {["OPEN", "TRIAGED", "ASSIGNED"].includes(row.status) && (
            <PermissionGuard permission={PERMISSIONS.REQUEST_ASSIGN}>
              <Tooltip title="Assign Technician">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAssignDialogRequest(row);
                    setAssignedStaffId(row.assignedStaffId || "");
                  }}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <AssignmentIndIcon fontSize="small" sx={{ color: DESIGN_TOKENS.brand[600] }} />
                </IconButton>
              </Tooltip>
            </PermissionGuard>
          )}

          {["ASSIGNED", "IN_PROGRESS"].includes(row.status) && (
            <PermissionGuard permission={PERMISSIONS.REQUEST_UPDATE_STATUS}>
              <Tooltip title="Update Progression">
                <IconButton
                  size="small"
                  onClick={() => {
                    setStatusDialogRequest(row);
                    setNewStatus(row.status === "ASSIGNED" ? "IN_PROGRESS" : "COMPLETED");
                  }}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <BuildIcon fontSize="small" sx={{ color: "#D97706" }} />
                </IconButton>
              </Tooltip>
            </PermissionGuard>
          )}

          {row.status === "COMPLETED" && (
            <PermissionGuard permission={PERMISSIONS.REQUEST_VERIFY}>
              <Tooltip title="Verify Repair Quality">
                <IconButton
                  size="small"
                  onClick={() => {
                    setVerifyDialogRequest(row);
                    setVerifyApproved(true);
                  }}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <VerifiedUserIcon fontSize="small" sx={{ color: "#16A34A" }} />
                </IconButton>
              </Tooltip>
            </PermissionGuard>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Maintenance & Work Orders"
        subtitle="7-stage lifecycle task governance, priority dispatch, SLA tracking, and resident quality sign-off"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Maintenance Requests" }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{
                bgcolor: "#FFFFFF",
                border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                borderRadius: "8px",
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: 1.5,
                  py: 0.5,
                  color: DESIGN_TOKENS.text.secondary,
                  "&.Mui-selected": {
                    bgcolor: DESIGN_TOKENS.brand[50],
                    color: DESIGN_TOKENS.brand[600],
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ToggleButton value="cards">
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="table">
                <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.REQUEST_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Log Ticket
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BuildIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Unresolved Tickets
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : openCount + inProgressCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Emergency Priority
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : emergencyCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F0FDF4",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Active / Dispatched
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : inProgressCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets by title, description, or category..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setPriorityFilter("");
          setCategoryFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || priorityFilter || categoryFilter || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Trades</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Priorities</MenuItem>
            {PRIORITIES.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {["OPEN", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "CLOSED"].map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No maintenance requests found"
          description="Log a repair ticket or modify your active filter criteria."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Log First Ticket
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredRequests.map((req) => {
            const rId = req.id || req._id;
            const pStyle = getPriorityColor(req.priority);

            return (
              <Grid item xs={12} sm={6} md={4} key={rId}>
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
                      boxShadow: "0 6px 18px -3px rgba(15, 23, 42, 0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Chip
                        label={`${req.priority} • ${SLA_HOURS[req.priority]?.split(" ")[0] || "48h"}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: pStyle.bg,
                          color: pStyle.text,
                          border: `1px solid ${pStyle.border}`,
                        }}
                      />
                      <StatusChip status={req.status} />
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, mb: 0.5 }}>
                      {req.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: DESIGN_TOKENS.text.secondary,
                        fontSize: "0.8125rem",
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {req.description}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Unit Location
                        </Typography>
                        <Chip
                          label={req.category}
                          size="small"
                          sx={{ fontSize: "0.6875rem", fontWeight: 700, bgcolor: DESIGN_TOKENS.brand[50], color: DESIGN_TOKENS.brand[600] }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                        Flat {req.flat?.flatNumber || req.flatId || "-"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        {req.building?.name || "Greenwood Valley Residences"}
                      </Typography>

                      {req.assignedStaff && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: "0.6875rem", bgcolor: DESIGN_TOKENS.brand[600] }}>
                            {req.assignedStaff?.user?.firstName?.[0] || "T"}
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                            {req.assignedStaff?.user?.firstName} {req.assignedStaff?.user?.lastName} ({req.assignedStaff?.subCategory || "Technician"})
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedRequest(req)}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: DESIGN_TOKENS.line[200],
                        color: DESIGN_TOKENS.brand[600],
                        "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
                      }}
                    >
                      Ticket File
                    </Button>

                    {["OPEN", "TRIAGED", "ASSIGNED"].includes(req.status) && (
                      <PermissionGuard permission={PERMISSIONS.REQUEST_ASSIGN}>
                        <Tooltip title="Assign Technician">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAssignDialogRequest(req);
                              setAssignedStaffId(req.assignedStaffId || "");
                            }}
                            sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}`, borderRadius: "8px" }}
                          >
                            <AssignmentIndIcon fontSize="small" sx={{ color: DESIGN_TOKENS.brand[600] }} />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                    )}

                    {["ASSIGNED", "IN_PROGRESS"].includes(req.status) && (
                      <PermissionGuard permission={PERMISSIONS.REQUEST_UPDATE_STATUS}>
                        <Tooltip title="Advance Progress">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setStatusDialogRequest(req);
                              setNewStatus(req.status === "ASSIGNED" ? "IN_PROGRESS" : "COMPLETED");
                            }}
                            sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}`, borderRadius: "8px" }}
                          >
                            <BuildIcon fontSize="small" sx={{ color: "#D97706" }} />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                    )}

                    {req.status === "COMPLETED" && (
                      <PermissionGuard permission={PERMISSIONS.REQUEST_VERIFY}>
                        <Tooltip title="Verify Repair Quality">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setVerifyDialogRequest(req);
                              setVerifyApproved(true);
                            }}
                            sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}`, borderRadius: "8px" }}
                          >
                            <VerifiedUserIcon fontSize="small" sx={{ color: "#16A34A" }} />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredRequests}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedRequest(row)}
        />
      )}

      {/* Create Maintenance Request Modal */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Log Maintenance Work Order Ticket
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createMutation.error?.response?.data?.message || "Failed to create maintenance request."}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                  <InputLabel>Building Complex</InputLabel>
                  <Select label="Building Complex" defaultValue="" {...register("buildingId")}>
                    {buildings.map((b) => (
                      <MenuItem key={b.id || b._id} value={b.id || b._id}>
                        {b.name} ({b.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.flatId)}>
                  <InputLabel>Flat Unit</InputLabel>
                  <Select label="Flat Unit" defaultValue="" {...register("flatId")}>
                    {availableFlats.map((f) => (
                      <MenuItem key={f.id || f._id} value={f.id || f._id}>
                        Flat {f.flatNumber} (Floor {f.floor?.floorNumber || "-"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Issue Category</InputLabel>
                  <Select label="Issue Category" defaultValue="PLUMBING" {...register("category")}>
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.priority)}>
                  <InputLabel>Operational Priority</InputLabel>
                  <Select label="Operational Priority" defaultValue="MEDIUM" {...register("priority")}>
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p} ({SLA_HOURS[p]})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Issue Summary Title"
              placeholder="e.g. Master bathroom water pipe leakage"
              size="small"
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register("title")}
            />

            <TextField
              label="Detailed Problem Description"
              placeholder="Describe what is malfunctioning, urgency details, or access instructions..."
              multiline
              rows={4}
              fullWidth
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              {...register("description")}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={() => setIsCreateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {createMutation.isPending ? "Submitting..." : "Dispatch Ticket"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog
        open={Boolean(assignDialogRequest)}
        onClose={() => setAssignDialogRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Assign Technical Specialist
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {assignMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {assignMutation.error?.response?.data?.message || "Failed to assign technician."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Ticket: <strong>{assignDialogRequest?.title}</strong> ({assignDialogRequest?.category})
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Select Qualified Technician</InputLabel>
            <Select
              label="Select Qualified Technician"
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
            >
              {eligibleStaff.length === 0 ? (
                <MenuItem disabled value="">
                  No matching trade specialists deployed
                </MenuItem>
              ) : (
                eligibleStaff.map((s) => (
                  <MenuItem key={s.id || s._id} value={s.id || s._id}>
                    {s.user?.firstName} {s.user?.lastName} ({s.subCategory || s.category} • Shift: {s.assignedShift})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setAssignDialogRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!assignedStaffId || assignMutation.isPending}
            onClick={handleAssignSubmit}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              fontWeight: 600,
            }}
          >
            {assignMutation.isPending ? "Assigning..." : "Confirm Dispatch"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advance Progression Status Dialog */}
      <Dialog
        open={Boolean(statusDialogRequest)}
        onClose={() => setStatusDialogRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Update Work Order Execution Status
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {updateStatusMutation.error?.response?.data?.message || "Failed to update work order status."}
            </Alert>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Target Status</InputLabel>
            <Select
              label="Target Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="IN_PROGRESS">IN_PROGRESS (Technician on-site)</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED (Repair finished)</MenuItem>
            </Select>
          </FormControl>

          {newStatus === "COMPLETED" && (
            <TextField
              label="Completion Photo Proof URL"
              placeholder="https://res.cloudinary.com/..."
              size="small"
              fullWidth
              value={completionPhoto}
              onChange={(e) => setCompletionPhoto(e.target.value)}
              helperText="Cloudinary CDN image URL proving repair resolution"
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setStatusDialogRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={updateStatusMutation.isPending}
            onClick={handleStatusSubmit}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              fontWeight: 600,
            }}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Confirm Status Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quality Verification Dialog */}
      <Dialog
        open={Boolean(verifyDialogRequest)}
        onClose={() => setVerifyDialogRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Resident Repair Quality Sign-Off
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {verifyMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {verifyMutation.error?.response?.data?.message || "Failed to verify repair."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Verify resolution quality for: <strong>{verifyDialogRequest?.title}</strong>
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant={verifyApproved ? "contained" : "outlined"}
              color="success"
              fullWidth
              onClick={() => setVerifyApproved(true)}
            >
              Approve Repair
            </Button>
            <Button
              variant={!verifyApproved ? "contained" : "outlined"}
              color="error"
              fullWidth
              onClick={() => setVerifyApproved(false)}
            >
              Reject (Request Rework)
            </Button>
          </Stack>

          <TextField
            label="Resident Inspection Feedback"
            placeholder="Provide inspection feedback or describe remaining issues if rejecting..."
            multiline
            rows={3}
            fullWidth
            value={verifyFeedback}
            onChange={(e) => setVerifyFeedback(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setVerifyDialogRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={verifyMutation.isPending}
            onClick={handleVerifySubmit}
            sx={{
              bgcolor: verifyApproved ? "success.main" : "error.main",
              fontWeight: 600,
            }}
          >
            {verifyMutation.isPending ? "Submitting..." : verifyApproved ? "Confirm Approval" : "Request Rework"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket File Inspection Modal */}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700 }}>
              <BuildIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                Ticket #{selectedRequest?.ticketNumber || (selectedRequest?.id || selectedRequest?._id || "").slice(-6).toUpperCase()}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {selectedRequest?.category} • Priority: {selectedRequest?.priority}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 0.5 }}>
                Problem Title
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, mb: 1 }}>
                {selectedRequest?.title}
              </Typography>
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, whiteSpace: "pre-wrap" }}>
                {selectedRequest?.description}
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                    Flat {selectedRequest?.flat?.flatNumber || selectedRequest?.flatId || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    SLA Target
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.brand[600] }}>
                    {SLA_HOURS[selectedRequest?.priority] || "48h"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Current Status
                  </Typography>
                  <StatusChip status={selectedRequest?.status} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Assigned Technician
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                    {selectedRequest?.assignedStaff
                      ? `${selectedRequest.assignedStaff?.user?.firstName} ${selectedRequest.assignedStaff?.user?.lastName}`
                      : "Unassigned"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedRequest(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Ticket File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceRequestsListPage;
