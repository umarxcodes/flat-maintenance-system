// =====================  STAFF DIRECTORY LIST PAGE  ===========
import React, { useState, useMemo } from "react";
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
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SecurityIcon from "@mui/icons-material/Security";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStaffList, useCreateStaffMutation } from "../../features/staff/hooks/use-staff.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
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

const CATEGORIES = ["MAINTENANCE", "SECURITY", "ADMINISTRATION", "CLEANING"];

const CATEGORY_SUBCATEGORY_MAP = {
  MAINTENANCE: ["PLUMBER", "ELECTRICIAN", "HVAC_TECH", "HANDYMAN"],
  SECURITY: ["GATE_GUARD", "LOBBY_GUARD"],
  CLEANING: ["CLEANER"],
  ADMINISTRATION: [],
};

const SHIFTS = ["MORNING", "EVENING", "NIGHT", "ROTATIONAL"];

const staffSchema = z
  .object({
    userId: z.string().min(1, "Staff user account is required"),
    buildingId: z.string().min(1, "Building complex is required"),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Category is required" }) }),
    subCategory: z.string().optional().nullable(),
    designation: z
      .string()
      .trim()
      .min(2, "Designation must be at least 2 characters")
      .max(64, "Designation cannot exceed 64 characters"),
    assignedShift: z.enum(SHIFTS).default("MORNING"),
  })
  .superRefine((data, ctx) => {
    if (data.category !== "ADMINISTRATION" && !data.subCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Trade specialization is required for ${data.category}`,
        path: ["subCategory"],
      });
    }
  });

export const StaffListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: usersData } = useUsersList({ limit: 100 });
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(shiftFilter && { assignedShift: shiftFilter }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useStaffList(queryParams);
  const createMutation = useCreateStaffMutation();

  const rawStaff = data?.staff || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawStaff.length;

  const filteredStaff = useMemo(() => {
    if (!search) return rawStaff;
    const q = search.toLowerCase();
    return rawStaff.filter((s) => {
      const name = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
      const email = (s.user?.email || "").toLowerCase();
      const desig = (s.designation || "").toLowerCase();
      const trade = (s.subCategory || "").toLowerCase();
      return name.includes(q) || email.includes(q) || desig.includes(q) || trade.includes(q);
    });
  }, [rawStaff, search]);

  // Metrics
  const activeCount = useMemo(() => rawStaff.filter((s) => s.status === "ACTIVE").length, [rawStaff]);
  const averageRating = useMemo(() => {
    const rated = rawStaff.filter((s) => s.averageRating > 0);
    if (rated.length === 0) return 5.0;
    const total = rated.reduce((sum, s) => sum + s.averageRating, 0);
    return (total / rated.length).toFixed(1);
  }, [rawStaff]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      category: "MAINTENANCE",
      subCategory: "PLUMBER",
      designation: "Senior Maintenance Technician",
      assignedShift: "MORNING",
    },
  });

  const selectedCategory = watch("category");
  const availableSubCategories = CATEGORY_SUBCATEGORY_MAP[selectedCategory] || [];

  const handleOpenCreate = () => {
    reset({
      userId: "",
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
      category: "MAINTENANCE",
      subCategory: "PLUMBER",
      designation: "Maintenance Specialist",
      assignedShift: "MORNING",
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    const payload = {
      userId: values.userId,
      buildingId: values.buildingId,
      category: values.category,
      designation: values.designation,
      assignedShift: values.assignedShift,
      ...(values.category !== "ADMINISTRATION" && values.subCategory ? { subCategory: values.subCategory } : {}),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "SECURITY":
        return <SecurityIcon sx={{ fontSize: 20 }} />;
      case "CLEANING":
        return <CleaningServicesIcon sx={{ fontSize: 20 }} />;
      case "ADMINISTRATION":
        return <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />;
      default:
        return <EngineeringIcon sx={{ fontSize: 20 }} />;
    }
  };

  const columns = [
    {
      id: "name",
      label: "Staff Personnel",
      render: (_, row) => {
        const initials = `${row.user?.firstName?.[0] || ""}${row.user?.lastName?.[0] || ""}`.toUpperCase() || "S";
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 38, height: 38, bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700, fontSize: "0.875rem" }}>
              {initials}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
                {row.user?.firstName} {row.user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {row.designation || row.user?.email}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: "trade",
      label: "Category & Specialization",
      render: (_, row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={row.category}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
            }}
          />
          {row.subCategory && (
            <Chip
              label={row.subCategory}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
              }}
            />
          )}
        </Stack>
      ),
    },
    {
      id: "shift",
      label: "Assigned Shift",
      render: (_, row) => (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <AccessTimeIcon sx={{ fontSize: 16, color: DESIGN_TOKENS.text.secondary }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary, fontSize: "0.8125rem" }}>
            {row.assignedShift || "MORNING"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "rating",
      label: "Performance Rating",
      render: (_, row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Rating value={row.averageRating || 5} precision={0.5} size="small" readOnly />
          <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
            {row.averageRating ? row.averageRating.toFixed(1) : "5.0"} ({row.totalRatingsCount || 0})
          </Typography>
        </Stack>
      ),
    },
    {
      id: "status",
      label: "Duty Status",
      render: (val) => <StatusChip status={val || "ACTIVE"} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSelectedStaff(row)}
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "none",
            borderColor: DESIGN_TOKENS.line[200],
            color: DESIGN_TOKENS.brand[600],
            "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
          }}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Operations & Staff Directory"
        subtitle="On-site technical specialists, security guards, work shifts, and service rating performance"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Staff" }]}
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

            <PermissionGuard permission={PERMISSIONS.STAFF_MANAGE}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Onboard Personnel
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
              <EngineeringIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Active Duty Personnel
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : activeCount}
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
              <StarIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Avg Service Rating
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : `${averageRating} / 5.0`}
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
              <SecurityIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Total Deployed Staff
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search personnel by name, email, designation, or trade..."
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
          setShiftFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || categoryFilter || shiftFilter || buildingFilter)}
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
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Work Shift</InputLabel>
          <Select
            value={shiftFilter}
            label="Work Shift"
            onChange={(e) => {
              setShiftFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Shifts</MenuItem>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
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
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="No operational staff personnel found"
          description="Onboard maintenance technicians, security guards, or adjust filter selections."
          action={
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>
              Onboard First Specialist
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredStaff.map((staffMember) => {
            const sId = staffMember.id || staffMember._id;
            const initials = `${staffMember.user?.firstName?.[0] || ""}${staffMember.user?.lastName?.[0] || ""}`.toUpperCase() || "S";

            return (
              <Grid item xs={12} sm={6} md={4} key={sId}>
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700, fontSize: "0.9375rem" }}>
                        {initials}
                      </Avatar>
                      <StatusChip status={staffMember.status || "ACTIVE"} />
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, mb: 0.25 }}>
                      {staffMember.user?.firstName} {staffMember.user?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 1.5 }}>
                      {staffMember.designation || "On-site Personnel"}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        icon={getCategoryIcon(staffMember.category)}
                        label={staffMember.category}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                          "& .MuiChip-icon": { color: DESIGN_TOKENS.brand[600] },
                        }}
                      />
                      {staffMember.subCategory && (
                        <Chip
                          label={staffMember.subCategory}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            bgcolor: "#F8FAFC",
                            border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                            color: DESIGN_TOKENS.text.primary,
                          }}
                        />
                      )}
                    </Stack>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Shift Schedule
                        </Typography>
                        <Chip
                          label={staffMember.assignedShift || "MORNING"}
                          size="small"
                          sx={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            bgcolor: "#FFFFFF",
                            border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                            color: DESIGN_TOKENS.text.primary,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                        {staffMember.building?.name || "Al-Raziq Heights"}
                      </Typography>

                      <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Rating
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Rating value={staffMember.averageRating || 5} precision={0.5} size="small" readOnly />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                            {staffMember.averageRating ? staffMember.averageRating.toFixed(1) : "5.0"}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedStaff(staffMember)}
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
                      Service Profile
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredStaff}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedStaff(row)}
        />
      )}

      {/* Onboard Staff Modal */}
      <Dialog
        open={isCreateOpen}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Onboard Operations & Duty Staff Personnel
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createMutation.error?.response?.data?.message || "Failed to onboard staff member."}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Staff User Identity & Assignment
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.userId)}>
                  <InputLabel>Select User Account</InputLabel>
                  <Select label="Select User Account" defaultValue="" {...register("userId")}>
                    {users.map((u) => (
                      <MenuItem key={u.id || u._id} value={u.id || u._id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

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
            </Grid>

            <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Trade Classification & Shift Schedule
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Operational Category</InputLabel>
                  <Select
                    label="Operational Category"
                    defaultValue="MAINTENANCE"
                    {...register("category")}
                    onChange={(e) => {
                      setValue("category", e.target.value);
                      const subList = CATEGORY_SUBCATEGORY_MAP[e.target.value] || [];
                      setValue("subCategory", subList[0] || null);
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  size="small"
                  error={Boolean(errors.subCategory)}
                  disabled={selectedCategory === "ADMINISTRATION"}
                >
                  <InputLabel>Trade Specialization</InputLabel>
                  <Select
                    label="Trade Specialization"
                    value={watch("subCategory") || ""}
                    onChange={(e) => setValue("subCategory", e.target.value)}
                  >
                    {availableSubCategories.map((sc) => (
                      <MenuItem key={sc} value={sc}>
                        {sc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Official Designation"
                  placeholder="e.g. Senior HVAC Specialist"
                  size="small"
                  fullWidth
                  error={Boolean(errors.designation)}
                  helperText={errors.designation?.message}
                  {...register("designation")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Work Shift</InputLabel>
                  <Select label="Assigned Work Shift" defaultValue="MORNING" {...register("assignedShift")}>
                    {SHIFTS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s} Shift
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
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
                fontWeight: 600,
              }}
            >
              {createMutation.isPending ? "Onboarding..." : "Deploy Personnel"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Staff Profile Inspection Modal */}
      <Dialog
        open={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700 }}>
              {selectedStaff?.user?.firstName?.[0] || "S"}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                {selectedStaff?.user?.firstName} {selectedStaff?.user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {selectedStaff?.designation} • {selectedStaff?.user?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Deployment & Shift
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    {selectedStaff?.building?.name || "Al-Raziq Heights"}
                  </Typography>
                  <StatusChip status={selectedStaff?.status || "ACTIVE"} />
                </Box>
                <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Assigned Shift: <strong>{selectedStaff?.assignedShift || "MORNING"}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Trade Specialization: <strong>{selectedStaff?.category} {selectedStaff?.subCategory ? `• ${selectedStaff.subCategory}` : ""}</strong>
                </Typography>
              </Paper>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Performance & Rating Score
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Rating value={selectedStaff?.averageRating || 5} precision={0.5} size="medium" readOnly />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary }}>
                    {selectedStaff?.averageRating ? selectedStaff.averageRating.toFixed(1) : "5.0"}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Based on {selectedStaff?.totalRatingsCount || 0} completed work order reviews.
                </Typography>
              </Paper>
            </Box>

            {selectedStaff?.user?.phone && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                  Contact Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    Phone: <strong>{selectedStaff.user.phone}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    Email: <strong>{selectedStaff.user.email}</strong>
                  </Typography>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedStaff(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Service Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffListPage;
