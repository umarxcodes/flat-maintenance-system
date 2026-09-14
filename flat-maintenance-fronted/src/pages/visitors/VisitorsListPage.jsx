// =====================  VISITORS REGISTER LIST PAGE  ==========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
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
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SearchIcon from "@mui/icons-material/Search";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useVisitorsList,
  useCreateVisitorPassMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
} from "../../features/visitors/hooks/use-visitors.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const VISITOR_TYPES = [
  { value: "GUEST", label: "Guest / Visitor", color: "primary" },
  { value: "DELIVERY", label: "Delivery Courier", color: "warning" },
  { value: "CAB", label: "Cab / Taxi", color: "info" },
  { value: "SERVICE_TECHNICIAN", label: "Service Technician", color: "secondary" },
  { value: "OTHER", label: "Other", color: "default" },
];

const VISITOR_STATUS_LIST = ["EXPECTED", "CHECKED_IN", "CHECKED_OUT", "EXPIRED", "DENIED"];

// Zero-Trust pass generation schema conforming strictly to backend createVisitorPassSchema
const visitorPassFormSchema = z.object({
  flatId: z.string().min(1, "Destination Flat is required"),
  visitorName: z
    .string()
    .trim()
    .min(2, "Visitor name must be at least 2 characters")
    .max(100, "Visitor name cannot exceed 100 characters"),
  visitorPhone: z.string().trim().max(20).optional().or(z.literal("")),
  vehicleNumber: z.string().trim().max(20).optional().or(z.literal("")),
  visitorType: z.enum(["GUEST", "DELIVERY", "CAB", "SERVICE_TECHNICIAN", "OTHER"]),
  visitorCount: z.coerce.number().int().min(1).max(50).default(1),
  expectedArrivalDate: z.string().min(1, "Expected arrival date is required"),
});

export const VisitorsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  // Modals state
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [inspectPass, setInspectPass] = useState(null);
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [checkInVehicle, setCheckInVehicle] = useState("");

  // Queries & Mutations
  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { visitorType: typeFilter }),
  };

  const { data, isLoading, isError, error, refetch } = useVisitorsList(queryParams);
  const { data: flatsData } = useFlatsList({ limit: 100 });
  const flats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);

  const createPassMutation = useCreateVisitorPassMutation();
  const checkInMutation = useCheckInVisitorMutation();
  const checkOutMutation = useCheckOutVisitorMutation();

  const visitors = data?.visitors || (Array.isArray(data) ? data : []);
  const totalCount = data?.meta?.totalRecords || data?.total || visitors.length;

  // Filter client-side search query
  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase().trim();
    return visitors.filter((v) => {
      const name = (v.visitorName || "").toLowerCase();
      const phone = (v.visitorPhone || "").toLowerCase();
      const passCode = (v.passCode || "").toLowerCase();
      const vehicle = (v.vehicleNumber || "").toLowerCase();
      const flatNum = (v.flatId?.flatNumber || v.flat?.flatNumber || "").toString().toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        passCode.includes(q) ||
        vehicle.includes(q) ||
        flatNum.includes(q)
      );
    });
  }, [visitors, searchQuery]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = visitors.length;
    const expected = visitors.filter((v) => v.status === "EXPECTED").length;
    const onPremises = visitors.filter((v) => v.status === "CHECKED_IN").length;
    const departed = visitors.filter((v) => v.status === "CHECKED_OUT").length;
    return { total, expected, onPremises, departed };
  }, [visitors]);

  // Form Management
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(visitorPassFormSchema),
    defaultValues: {
      flatId: "",
      visitorName: "",
      visitorPhone: "",
      vehicleNumber: "",
      visitorType: "GUEST",
      visitorCount: 1,
      expectedArrivalDate: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
    },
  });

  const onSubmitPass = (values) => {
    // Sanitize payload strictly adhering to backend createVisitorPassSchema
    const payload = {
      flatId: values.flatId,
      visitorName: values.visitorName.trim(),
      visitorType: values.visitorType,
      visitorCount: Number(values.visitorCount) || 1,
      expectedArrivalDate: new Date(values.expectedArrivalDate).toISOString(),
    };

    if (values.visitorPhone?.trim()) {
      payload.visitorPhone = values.visitorPhone.trim();
    }
    if (values.vehicleNumber?.trim()) {
      payload.vehicleNumber = values.vehicleNumber.trim();
    }

    createPassMutation.mutate(payload, {
      onSuccess: () => {
        setIsPassOpen(false);
        reset();
      },
    });
  };

  const handleOpenCheckInDialog = (visitor) => {
    setCheckInTarget(visitor);
    setCheckInVehicle(visitor.vehicleNumber || "");
  };

  const handleConfirmCheckIn = () => {
    if (!checkInTarget) return;
    const targetId = checkInTarget.id || checkInTarget._id;
    checkInMutation.mutate(
      { id: targetId, vehicleNumber: checkInVehicle },
      {
        onSuccess: () => {
          setCheckInTarget(null);
          setCheckInVehicle("");
          if (inspectPass && (inspectPass.id === targetId || inspectPass._id === targetId)) {
            setInspectPass((prev) => ({
              ...prev,
              status: "CHECKED_IN",
              entryTimestamp: new Date().toISOString(),
              vehicleNumber: checkInVehicle || prev.vehicleNumber,
            }));
          }
        },
      }
    );
  };

  const handleConfirmCheckOut = (visitor) => {
    const targetId = visitor.id || visitor._id;
    checkOutMutation.mutate(targetId, {
      onSuccess: () => {
        if (inspectPass && (inspectPass.id === targetId || inspectPass._id === targetId)) {
          setInspectPass((prev) => ({
            ...prev,
            status: "CHECKED_OUT",
            exitTimestamp: new Date().toISOString(),
          }));
        }
      },
    });
  };

  const columns = [
    {
      id: "visitorName",
      label: "Visitor Credentials",
      render: (val, row) => (
        <Box
          sx={{ cursor: "pointer" }}
          onClick={() => setInspectPass(row)}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {val}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {row.visitorPhone || "No Phone"}
            </Typography>
            {row.visitorCount > 1 && (
              <Chip
                label={`+${row.visitorCount - 1}`}
                size="small"
                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>
      ),
    },
    {
      id: "passCode",
      label: "Gate Passcode",
      render: (val) => (
        <Chip
          label={val || "------"}
          variant="outlined"
          color="primary"
          sx={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: "0.85rem",
            letterSpacing: "0.15em",
            borderRadius: "8px",
          }}
        />
      ),
    },
    {
      id: "visitorType",
      label: "Category",
      render: (val) => {
        const item = VISITOR_TYPES.find((t) => t.value === val);
        return (
          <Chip
            label={item?.label || val}
            size="small"
            color={item?.color || "default"}
            variant="soft"
            sx={{ fontWeight: 600, borderRadius: "6px" }}
          />
        );
      },
    },
    {
      id: "destination",
      label: "Destination Flat",
      render: (_, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Flat {row.flatId?.flatNumber || row.flat?.flatNumber || "Unit"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.hostUserId?.firstName
              ? `Host: ${row.hostUserId.firstName} ${row.hostUserId.lastName || ""}`
              : "Resident Host"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "vehicleNumber",
      label: "Vehicle Plate",
      render: (val) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: val ? "monospace" : "inherit",
            fontWeight: val ? 700 : 400,
            color: val ? "text.primary" : "text.secondary",
          }}
        >
          {val || "—"}
        </Typography>
      ),
    },
    {
      id: "expectedArrivalDate",
      label: "Expected Arrival",
      render: (val) =>
        val ? (
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            {new Date(val).toLocaleString("en-PK", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </Typography>
        ) : (
          "—"
        ),
    },
    {
      id: "status",
      label: "Gate Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Gate Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Inspect Pass">
            <IconButton
              size="small"
              onClick={() => setInspectPass(row)}
              sx={{ color: "text.secondary" }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY}>
            {row.status === "EXPECTED" && (
              <Tooltip title="Gate Check-In">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleOpenCheckInDialog(row)}
                  disabled={checkInMutation.isPending}
                >
                  <LoginIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {row.status === "CHECKED_IN" && (
              <Tooltip title="Gate Check-Out">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleConfirmCheckOut(row)}
                  disabled={checkOutMutation.isPending}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Visitor Gate Management"
        subtitle="Zero-Trust visitor authorization, digital 6-digit gate passes, vehicle tracking, and entry/exit telemetry"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Visitors" }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY}>
              <Button
                component={RouterLink}
                to="/visitors/verify"
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                sx={{ borderRadius: "10px" }}
              >
                Scan / Verify Pass
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.VISITOR_CREATE}>
              <Button
                variant="contained"
                startIcon={<TransferWithinAStationIcon />}
                onClick={() => {
                  reset({
                    flatId: "",
                    visitorName: "",
                    visitorPhone: "",
                    vehicleNumber: "",
                    visitorType: "GUEST",
                    visitorCount: 1,
                    expectedArrivalDate: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
                  });
                  setIsPassOpen(true);
                }}
                sx={{ borderRadius: "10px" }}
              >
                Pre-Generate Pass
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* KPI Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Gate Passes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "#0B132B" }}>
                  {kpiMetrics.total}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <BadgeIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Expected Arrivals
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
                  {kpiMetrics.expected}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <AccessTimeIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Inside Premises Now
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                  {kpiMetrics.onPremises}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "success.lighter",
                  color: "success.main",
                }}
              >
                <MeetingRoomIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Departed / Completed
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.secondary" }}>
                  {kpiMetrics.departed}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#F1F5F9",
                  color: "text.secondary",
                }}
              >
                <CheckCircleOutlineIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and View Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search visitor, phone, passcode, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />

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
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                {VISITOR_STATUS_LIST.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Visitor Type</InputLabel>
              <Select
                value={typeFilter}
                label="Visitor Type"
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Types</em>
                </MenuItem>
                {VISITOR_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(statusFilter || typeFilter || searchQuery) && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setStatusFilter("");
                  setTypeFilter("");
                  setSearchQuery("");
                  setPage(0);
                }}
                sx={{ alignSelf: "center", color: "text.secondary" }}
              >
                Reset
              </Button>
            )}
          </Stack>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Main Content Area: 4 States */}
      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton variant="rounded" height={230} sx={{ borderRadius: "14px" }} />
            </Grid>
          ))}
        </Grid>
      ) : isError ? (
        <Alert
          severity="error"
          sx={{ borderRadius: "12px", mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || "Failed to load visitor passes from the server."}
        </Alert>
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          title="No Visitor Passes Found"
          description={
            statusFilter || typeFilter || searchQuery
              ? "No visitor records matched your active filter criteria."
              : "Pre-generate your first digital visitor pass to facilitate seamless, secure gate check-in."
          }
          action={
            <Button
              variant="contained"
              startIcon={<TransferWithinAStationIcon />}
              onClick={() => setIsPassOpen(true)}
              sx={{ borderRadius: "10px" }}
            >
              Pre-Generate Pass
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <Box>
          <Grid container spacing={2.5}>
            {filteredVisitors.map((pass) => (
              <Grid item xs={12} sm={6} md={4} key={pass._id || pass.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    transition: "all 0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, pb: 1.5 }}>
                    {/* Header Row */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip
                        label={pass.passCode || "PASS"}
                        variant="outlined"
                        color="primary"
                        sx={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          letterSpacing: "0.1em",
                          borderRadius: "6px",
                        }}
                      />
                      <StatusChip status={pass.status} />
                    </Stack>

                    {/* Visitor Title */}
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#0B132B" }}>
                      {pass.visitorName}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, mb: 2 }}>
                      <Chip
                        label={VISITOR_TYPES.find((t) => t.value === pass.visitorType)?.label || pass.visitorType}
                        size="small"
                        color={VISITOR_TYPES.find((t) => t.value === pass.visitorType)?.color || "default"}
                        sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
                      />
                      {pass.visitorCount > 1 && (
                        <Chip
                          label={`${pass.visitorCount} People`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      )}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Quick Info Items */}
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HomeIcon fontSize="inherit" color="action" />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Flat {pass.flatId?.flatNumber || pass.flat?.flatNumber || "Assigned Unit"}
                        </Typography>
                      </Stack>

                      {pass.visitorPhone && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PhoneIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {pass.visitorPhone}
                          </Typography>
                        </Stack>
                      )}

                      {pass.vehicleNumber && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DirectionsCarIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                            {pass.vehicleNumber}
                          </Typography>
                        </Stack>
                      )}

                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="inherit" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Expected:{" "}
                          {pass.expectedArrivalDate
                            ? new Date(pass.expectedArrivalDate).toLocaleString("en-PK", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  {/* Card Actions */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      bgcolor: "#F8FAFC",
                      borderTop: "1px solid #F1F5F9",
                      borderBottomLeftRadius: "14px",
                      borderBottomRightRadius: "14px",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => setInspectPass(pass)}
                        startIcon={<VisibilityIcon fontSize="small" />}
                      >
                        Inspect
                      </Button>

                      <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY}>
                        {pass.status === "EXPECTED" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleOpenCheckInDialog(pass)}
                            startIcon={<LoginIcon />}
                            disabled={checkInMutation.isPending}
                            sx={{ borderRadius: "8px", fontWeight: 700 }}
                          >
                            Check In
                          </Button>
                        )}

                        {pass.status === "CHECKED_IN" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            onClick={() => handleConfirmCheckOut(pass)}
                            startIcon={<LogoutIcon />}
                            disabled={checkOutMutation.isPending}
                            sx={{ borderRadius: "8px", fontWeight: 700 }}
                          >
                            Check Out
                          </Button>
                        )}
                      </PermissionGuard>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Simple Pagination Footer for Cards */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <DataTable
              columns={[]}
              rows={[]}
              isLoading={false}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(r) => {
                setRowsPerPage(r);
                setPage(0);
              }}
            />
          </Box>
        </Box>
      ) : (
        /* Data Table View */
        <DataTable
          columns={columns}
          rows={filteredVisitors}
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
      )}

      {/* Pre-Generate Visitor Pass Modal */}
      <Dialog open={isPassOpen} onClose={() => setIsPassOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 1 }}>
          Pre-Generate Digital Visitor Pass
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitPass)} noValidate>
          <DialogContent dividers sx={{ p: 3 }}>
            {createPassMutation.isError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
                {createPassMutation.error?.response?.data?.message ||
                  createPassMutation.error?.message ||
                  "Failed to generate visitor pass."}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small" error={Boolean(errors.flatId)}>
                <InputLabel>Destination Flat Unit</InputLabel>
                <Select
                  label="Destination Flat Unit"
                  defaultValue=""
                  {...register("flatId")}
                >
                  {flats.map((f) => (
                    <MenuItem key={f._id || f.id} value={f._id || f.id}>
                      Flat {f.flatNumber} {f.blockId?.name ? `(${f.blockId.name})` : ""}
                    </MenuItem>
                  ))}
                </Select>
                {errors.flatId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.flatId.message}
                  </Typography>
                )}
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Visitor Full Name"
                    placeholder="e.g. Tariq Mehmood"
                    fullWidth
                    size="small"
                    error={Boolean(errors.visitorName)}
                    helperText={errors.visitorName?.message}
                    {...register("visitorName")}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Phone Number"
                    placeholder="e.g. +923001234567"
                    fullWidth
                    size="small"
                    error={Boolean(errors.visitorPhone)}
                    helperText={errors.visitorPhone?.message}
                    {...register("visitorPhone")}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Visitor Type</InputLabel>
                    <Select label="Visitor Type" defaultValue="GUEST" {...register("visitorType")}>
                      {VISITOR_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Party Count (Persons)"
                    type="number"
                    defaultValue={1}
                    inputProps={{ min: 1, max: 50 }}
                    fullWidth
                    size="small"
                    error={Boolean(errors.visitorCount)}
                    helperText={errors.visitorCount?.message}
                    {...register("visitorCount")}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Vehicle License Plate (Optional)"
                    placeholder="e.g. LE-1234"
                    fullWidth
                    size="small"
                    error={Boolean(errors.vehicleNumber)}
                    helperText={errors.vehicleNumber?.message}
                    {...register("vehicleNumber")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Expected Arrival Date & Time"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.expectedArrivalDate)}
                    helperText={errors.expectedArrivalDate?.message}
                    {...register("expectedArrivalDate")}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPassOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createPassMutation.isPending}
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            >
              {createPassMutation.isPending ? "Generating..." : "Generate Passcode"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Gate Check-In Vehicle Capture Dialog */}
      <Dialog
        open={Boolean(checkInTarget)}
        onClose={() => setCheckInTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Record Gate Arrival (Check In)</DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Confirm arrival for <b>{checkInTarget?.visitorName}</b> (Pass: {checkInTarget?.passCode}).
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Arriving Vehicle Number"
            placeholder="e.g. ABC-1234"
            value={checkInVehicle}
            onChange={(e) => setCheckInVehicle(e.target.value)}
            helperText="Leave empty if arrival is on foot or vehicle plate is unchanged"
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2 }}>
          <Button onClick={() => setCheckInTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmCheckIn}
            disabled={checkInMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            {checkInMutation.isPending ? "Recording..." : "Confirm Arrival"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inspect Visitor Pass Modal */}
      <Dialog
        open={Boolean(inspectPass)}
        onClose={() => setInspectPass(null)}
        maxWidth="sm"
        fullWidth
      >
        {inspectPass && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Gate Pass Inspection
                </Typography>
                <StatusChip status={inspectPass.status} />
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {/* Monospace Passcode Box */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  textAlign: "center",
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.05em" }}>
                  6-DIGIT VERIFICATION PASSCODE
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 900,
                    letterSpacing: "0.25em",
                    color: "primary.main",
                    my: 0.5,
                  }}
                >
                  {inspectPass.passCode || "------"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Present this code to security gate personnel upon arrival
                </Typography>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Visitor Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {inspectPass.visitorName}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Contact Phone
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {inspectPass.visitorPhone || "Not Provided"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Destination Unit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Flat {inspectPass.flatId?.flatNumber || inspectPass.flat?.flatNumber || "Assigned"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Visitor Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {inspectPass.visitorType}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Party Size
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {inspectPass.visitorCount || 1} Person(s)
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle License Plate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {inspectPass.vehicleNumber || "None"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Expected Arrival
                  </Typography>
                  <Typography variant="body2">
                    {inspectPass.expectedArrivalDate
                      ? new Date(inspectPass.expectedArrivalDate).toLocaleString()
                      : "-"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Gate Entry Recorded
                  </Typography>
                  <Typography variant="body2" sx={{ color: inspectPass.entryTimestamp ? "success.main" : "inherit" }}>
                    {inspectPass.entryTimestamp ? new Date(inspectPass.entryTimestamp).toLocaleString() : "Not Checked In"}
                  </Typography>
                </Grid>

                {inspectPass.exitTimestamp && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Gate Departure Recorded
                    </Typography>
                    <Typography variant="body2">
                      {new Date(inspectPass.exitTimestamp).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setInspectPass(null)} color="inherit">
                Close
              </Button>
              {inspectPass.status === "EXPECTED" && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    handleOpenCheckInDialog(inspectPass);
                  }}
                  startIcon={<LoginIcon />}
                >
                  Check In
                </Button>
              )}
              {inspectPass.status === "CHECKED_IN" && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handleConfirmCheckOut(inspectPass)}
                  startIcon={<LogoutIcon />}
                >
                  Check Out
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default VisitorsListPage;

