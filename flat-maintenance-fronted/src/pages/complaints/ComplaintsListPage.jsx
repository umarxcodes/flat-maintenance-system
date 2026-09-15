// =====================  COMPLAINTS & GRIEVANCES PAGE  =======
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
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import GavelIcon from "@mui/icons-material/Gavel";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useComplaintsList,
  useCreateComplaintMutation,
  useResolveComplaintMutation,
} from "../../features/complaints/hooks/use-complaints.js";
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

const COMPLAINT_TYPES = [
  "NOISE_DISTURBANCE",
  "PARKING_DISPUTE",
  "SECURITY_BREACH",
  "SANITATION",
  "SOCIETY_RULE_VIOLATION",
  "OTHER",
];

const COMPLAINT_TYPE_LABELS = {
  NOISE_DISTURBANCE: "Noise Disturbance",
  PARKING_DISPUTE: "Parking Dispute",
  SECURITY_BREACH: "Security Breach",
  SANITATION: "Sanitation & Cleanliness",
  SOCIETY_RULE_VIOLATION: "Society Bylaws Violation",
  OTHER: "General Grievance",
};

const complaintSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().min(1, "Flat unit is required"),
  type: z.enum(COMPLAINT_TYPES, { errorMap: () => ({ message: "Complaint classification is required" }) }),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
});

export const ComplaintsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resolveDialogComplaint, setResolveDialogComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useComplaintsList(queryParams);
  const createMutation = useCreateComplaintMutation();
  const resolveMutation = useResolveComplaintMutation();

  const rawComplaints = data?.complaints || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawComplaints.length;

  const filteredComplaints = useMemo(() => {
    if (!search) return rawComplaints;
    const q = search.toLowerCase();
    return rawComplaints.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const type = (c.type || "").toLowerCase();
      const flatNo = String(c.flat?.flatNumber || c.flatId || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || type.includes(q) || flatNo.includes(q);
    });
  }, [rawComplaints, search]);

  // Metrics
  const openCount = useMemo(() => rawComplaints.filter((c) => c.status === "OPEN").length, [rawComplaints]);
  const investigationCount = useMemo(() => rawComplaints.filter((c) => c.status === "UNDER_INVESTIGATION").length, [rawComplaints]);
  const resolvedCount = useMemo(() => rawComplaints.filter((c) => c.status === "RESOLVED").length, [rawComplaints]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      buildingId: "",
      flatId: "",
      type: "NOISE_DISTURBANCE",
      title: "",
      description: "",
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
      type: "NOISE_DISTURBANCE",
      title: "",
      description: "",
    });
    setIsCreateOpen(true);
  };

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      },
    });
  };

  const handleResolveSubmit = () => {
    if (!resolveDialogComplaint || !resolutionNotes || resolutionNotes.trim().length < 5) return;
    resolveMutation.mutate(
      {
        id: resolveDialogComplaint.id || resolveDialogComplaint._id,
        data: { resolutionNotes: resolutionNotes.trim() },
      },
      {
        onSuccess: () => {
          setResolveDialogComplaint(null);
          setResolutionNotes("");
        },
      }
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "NOISE_DISTURBANCE":
        return <VolumeUpIcon sx={{ fontSize: 18 }} />;
      case "PARKING_DISPUTE":
        return <LocalParkingIcon sx={{ fontSize: 18 }} />;
      case "SECURITY_BREACH":
        return <SecurityIcon sx={{ fontSize: 18 }} />;
      case "SANITATION":
        return <CleaningServicesIcon sx={{ fontSize: 18 }} />;
      case "SOCIETY_RULE_VIOLATION":
        return <GavelIcon sx={{ fontSize: 18 }} />;
      default:
        return <ReportProblemIcon sx={{ fontSize: 18 }} />;
    }
  };

  const columns = [
    {
      id: "title",
      label: "Grievance Matter",
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
            {row.title}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            {COMPLAINT_TYPE_LABELS[row.type] || row.type}
          </Typography>
        </Box>
      ),
    },
    {
      id: "flat",
      label: "Associated Unit",
      render: (_, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
            Flat {row.flat?.flatNumber || row.flatId || "-"}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            {row.building?.name || "Al-Raziq Heights"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "status",
      label: "Resolution Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "createdAt",
      label: "Filed On",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
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
            onClick={() => setSelectedComplaint(row)}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: DESIGN_TOKENS.line[200],
              color: DESIGN_TOKENS.brand[600],
              "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
            }}
          >
            Inspect
          </Button>

          {["OPEN", "UNDER_INVESTIGATION"].includes(row.status) && (
            <PermissionGuard permission={PERMISSIONS.COMPLAINT_RESOLVE}>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setResolveDialogComplaint(row);
                  setResolutionNotes("");
                }}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  bgcolor: "#16A34A",
                  "&:hover": { bgcolor: "#15803D" },
                  textTransform: "none",
                }}
              >
                Resolve
              </Button>
            </PermissionGuard>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Grievances & Resident Complaints"
        subtitle="Resolution workflows for resident disputes, noise disruptions, bylaws infractions, and society governance"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Complaints" }]}
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

            <PermissionGuard permission={PERMISSIONS.COMPLAINT_CREATE}>
              <Button
                variant="contained"
                startIcon={<ReportProblemIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                File Grievance
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
                bgcolor: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReportProblemIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Unresolved Matters
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : openCount + investigationCount}
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
                bgcolor: "#FFFBEB",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GavelIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Under Investigation
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : investigationCount}
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
                Satisfactorily Resolved
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : resolvedCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search complaints by subject or details..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setTypeFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || typeFilter || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Dispute Type</InputLabel>
          <Select
            value={typeFilter}
            label="Dispute Type"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Classifications</MenuItem>
            {COMPLAINT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {COMPLAINT_TYPE_LABELS[t] || t}
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
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="UNDER_INVESTIGATION">Under Investigation</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Building</InputLabel>
          <Select
            value={buildingFilter}
            label="Building"
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Buildings</MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No grievances or complaints filed"
          description="Your community is operating peacefully with zero active disputes."
          action={
            <Button variant="contained" startIcon={<ReportProblemIcon />} onClick={handleOpenCreate}>
              File First Grievance
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredComplaints.map((c) => {
            const cId = c.id || c._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={cId}>
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
                        icon={getTypeIcon(c.type)}
                        label={COMPLAINT_TYPE_LABELS[c.type] || c.type}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                          "& .MuiChip-icon": { color: DESIGN_TOKENS.brand[600] },
                        }}
                      />
                      <StatusChip status={c.status} />
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, mb: 0.5 }}>
                      {c.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: DESIGN_TOKENS.text.secondary,
                        fontSize: "0.8125rem",
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.description}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        Location & Complainant
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                        Flat {c.flat?.flatNumber || c.flatId || "-"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                        {c.building?.name || "Al-Raziq Heights"}
                      </Typography>

                      {c.resolutionNotes && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #F1F5F9" }}>
                          <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700, display: "block" }}>
                            Resolution Note:
                          </Typography>
                          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                            {c.resolutionNotes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedComplaint(c)}
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
                      Case File
                    </Button>

                    {["OPEN", "UNDER_INVESTIGATION"].includes(c.status) && (
                      <PermissionGuard permission={PERMISSIONS.COMPLAINT_RESOLVE}>
                        <Button
                          variant="contained"
                          onClick={() => {
                            setResolveDialogComplaint(c);
                            setResolutionNotes("");
                          }}
                          sx={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            bgcolor: "#16A34A",
                            "&:hover": { bgcolor: "#15803D" },
                            textTransform: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Resolve
                        </Button>
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
          rows={filteredComplaints}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedComplaint(row)}
        />
      )}

      {/* File Complaint Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          File Community Grievance or Bylaw Complaint
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createMutation.error?.response?.data?.message || "Failed to submit complaint."}
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
                  <InputLabel>Related Flat Unit</InputLabel>
                  <Select label="Related Flat Unit" defaultValue="" {...register("flatId")}>
                    {availableFlats.map((f) => (
                      <MenuItem key={f.id || f._id} value={f.id || f._id}>
                        Flat {f.flatNumber} (Floor {f.floor?.floorNumber || "-"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth size="small" error={Boolean(errors.type)}>
              <InputLabel>Grievance Classification</InputLabel>
              <Select label="Grievance Classification" defaultValue="NOISE_DISTURBANCE" {...register("type")}>
                {COMPLAINT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {COMPLAINT_TYPE_LABELS[t] || t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Grievance Title"
              placeholder="e.g. Loud music disturbance after midnight from 4th floor"
              size="small"
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register("title")}
            />

            <TextField
              label="Detailed Incident Report"
              placeholder="Provide exact times, repeated occurrences, impact on neighbors, or witnesses..."
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
              {createMutation.isPending ? "Submitting..." : "Submit Grievance Report"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Resolve Complaint Modal */}
      <Dialog
        open={Boolean(resolveDialogComplaint)}
        onClose={() => setResolveDialogComplaint(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Resolve Grievance & Record Final Action
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {resolveMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {resolveMutation.error?.response?.data?.message || "Failed to resolve complaint."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Matter: <strong>{resolveDialogComplaint?.title}</strong>
          </Typography>

          <TextField
            label="Formal Resolution Notes (Mandatory)"
            placeholder="Document corrective actions taken, warnings issued, or agreements reached..."
            multiline
            rows={4}
            fullWidth
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            helperText="Resolution notes must contain at least 5 characters"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setResolveDialogComplaint(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={resolutionNotes.trim().length < 5 || resolveMutation.isPending}
            onClick={handleResolveSubmit}
            sx={{
              bgcolor: "#16A34A",
              "&:hover": { bgcolor: "#15803D" },
              fontWeight: 600,
            }}
          >
            {resolveMutation.isPending ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Case File Inspection Modal */}
      <Dialog
        open={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "#DC2626", fontWeight: 700 }}>
              <ReportProblemIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                Case File #{selectedComplaint?.id?.slice(-6).toUpperCase() || "REPORT"}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {COMPLAINT_TYPE_LABELS[selectedComplaint?.type] || selectedComplaint?.type}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 0.5 }}>
                Incident Description
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, mb: 1 }}>
                {selectedComplaint?.title}
              </Typography>
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, whiteSpace: "pre-wrap" }}>
                {selectedComplaint?.description}
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                    Flat {selectedComplaint?.flat?.flatNumber || selectedComplaint?.flatId || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Status
                  </Typography>
                  <StatusChip status={selectedComplaint?.status} />
                </Grid>
              </Grid>

              {selectedComplaint?.resolutionNotes && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#16A34A", display: "block", mb: 0.5 }}>
                    Formal Resolution Action
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    {selectedComplaint.resolutionNotes}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedComplaint(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Case File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplaintsListPage;
