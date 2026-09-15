// =====================  TENANTS REGISTRY LIST PAGE  ==========
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ApartmentIcon from "@mui/icons-material/Apartment";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useTenantsList,
  useOnboardTenantMutation,
  useMoveOutTenantMutation,
} from "../../features/tenants/hooks/use-tenants.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useOwnersList } from "../../features/owners/hooks/use-owners.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { formatCurrency } from "../../utils/format-currency.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

const tenantSchema = z
  .object({
    userId: z.string().min(1, "Tenant user account is required"),
    buildingId: z.string().min(1, "Building complex is required"),
    flatId: z.string().min(1, "Leased flat unit is required"),
    ownerId: z.string().min(1, "Property deed owner is required"),
    leaseStartDate: z.string().min(1, "Lease start date is required"),
    leaseEndDate: z.string().min(1, "Lease end date is required"),
    rentAmount: z.coerce.number().min(0, "Monthly rent must be a non-negative amount"),
    securityDeposit: z.coerce.number().min(0, "Security deposit must be non-negative"),
    policeVerificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
    emergencyContact: z.object({
      name: z.string().trim().min(2, "Contact name must be at least 2 characters").max(64),
      relationship: z.string().trim().min(2, "Relationship must be at least 2 characters").max(32),
      phone: z.string().trim().regex(E164_PHONE_REGEX, "Phone must be in E.164 format (e.g. +923001234567)"),
    }),
  })
  .refine((data) => new Date(data.leaseEndDate) > new Date(data.leaseStartDate), {
    message: "Lease expiration date must be strictly after the start date",
    path: ["leaseEndDate"],
  });

export const TenantsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [policeFilter, setPoliceFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [moveOutTenant, setMoveOutTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: usersData } = useUsersList({ limit: 100 });
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(buildingFilter && { buildingId: buildingFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(policeFilter && { policeVerificationStatus: policeFilter }),
  };

  const { data, isLoading } = useTenantsList(queryParams);
  const onboardMutation = useOnboardTenantMutation();
  const moveOutMutation = useMoveOutTenantMutation();

  const rawTenants = data?.tenants || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawTenants.length;

  const filteredTenants = useMemo(() => {
    if (!search) return rawTenants;
    const q = search.toLowerCase();
    return rawTenants.filter((t) => {
      const name = `${t.user?.firstName || ""} ${t.user?.lastName || ""}`.toLowerCase();
      const email = (t.user?.email || "").toLowerCase();
      const phone = (t.user?.phone || "").toLowerCase();
      const flatNo = String(t.flat?.flatNumber || t.flatId || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || flatNo.includes(q);
    });
  }, [rawTenants, search]);

  // Metrics
  const activeTenantsCount = useMemo(
    () => rawTenants.filter((t) => t.status === STATUSES.TENANT.ACTIVE).length,
    [rawTenants]
  );
  const totalRentRoll = useMemo(
    () => rawTenants.reduce((sum, t) => sum + (t.rentAmount || t.monthlyRent || 0), 0),
    [rawTenants]
  );
  const pendingPoliceCount = useMemo(
    () => rawTenants.filter((t) => t.policeVerificationStatus === "PENDING").length,
    [rawTenants]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      flatId: "",
      ownerId: "",
      leaseStartDate: new Date().toISOString().split("T")[0],
      leaseEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      rentAmount: 25000,
      securityDeposit: 50000,
      policeVerificationStatus: "PENDING",
      emergencyContact: {
        name: "",
        relationship: "Family",
        phone: "+923001234567",
      },
    },
  });

  const selectedBuildingId = watch("buildingId");

  // Load flats and owners for onboarding
  const { data: flatsData } = useFlatsList(
    selectedBuildingId ? { buildingId: selectedBuildingId, limit: 100 } : {}
  );
  const availableFlats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);

  const { data: ownersData } = useOwnersList(
    selectedBuildingId ? { buildingId: selectedBuildingId, limit: 100 } : {}
  );
  const availableOwners = ownersData?.owners || (Array.isArray(ownersData) ? ownersData : []);

  const handleOpenCreate = () => {
    reset({
      userId: "",
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
      flatId: "",
      ownerId: "",
      leaseStartDate: new Date().toISOString().split("T")[0],
      leaseEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      rentAmount: 25000,
      securityDeposit: 50000,
      policeVerificationStatus: "PENDING",
      emergencyContact: {
        name: "",
        relationship: "Family",
        phone: "+923001234567",
      },
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    onboardMutation.mutate(values, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const handleMoveOutConfirm = () => {
    if (!moveOutTenant) return;
    moveOutMutation.mutate(
      {
        id: moveOutTenant.id || moveOutTenant._id,
        data: { moveOutDate: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          setMoveOutTenant(null);
        },
      }
    );
  };

  const columns = [
    {
      id: "name",
      label: "Tenant Resident",
      render: (_, row) => {
        const initials = `${row.user?.firstName?.[0] || ""}${row.user?.lastName?.[0] || ""}`.toUpperCase() || "T";
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
                {row.user?.email}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: "flat",
      label: "Leased Unit",
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
      id: "rent",
      label: "Monthly Rent",
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
          {formatCurrency(row.rentAmount || row.monthlyRent || 0)}
        </Typography>
      ),
    },
    {
      id: "leaseDates",
      label: "Lease Term",
      render: (_, row) => (
        <Box>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
            {new Date(row.leaseStartDate).toLocaleDateString()} – {new Date(row.leaseEndDate).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
    {
      id: "policeVerificationStatus",
      label: "Police Verification",
      render: (val) => {
        const isVerified = val === "VERIFIED";
        const isRejected = val === "REJECTED";
        return (
          <Chip
            label={val || "PENDING"}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: isVerified ? "#F0FDF4" : isRejected ? "#FEF2F2" : "#FFFBEB",
              color: isVerified ? "#16A34A" : isRejected ? "#DC2626" : "#D97706",
              border: `1px solid ${isVerified ? "#BBF7D0" : isRejected ? "#FECACA" : "#FDE68A"}`,
            }}
          />
        );
      },
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
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedTenant(row)}
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

          {row.status === STATUSES.TENANT.ACTIVE && (
            <PermissionGuard permission={PERMISSIONS.TENANT_MANAGE}>
              <Tooltip title="Complete Move-Out (Checkout)">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setMoveOutTenant(row)}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <ExitToAppIcon fontSize="small" />
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
        title="Tenants & Lease Registry"
        subtitle="Active tenant contracts, lease renewals, police background verifications, and checkout workflows"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tenants" }]}
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

            <PermissionGuard permission={PERMISSIONS.TENANT_MANAGE}>
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
                Onboard Tenant
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
              <ApartmentIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Active Leases
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : activeTenantsCount}
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
              <MonetizationOnIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Monthly Rent Roll
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : formatCurrency(totalRentRoll)}
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
              <PendingActionsIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Police Background Verification
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : `${pendingPoliceCount} Pending Review`}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tenants by name, email, or flat number..."
        onReset={() => {
          setSearch("");
          setBuildingFilter("");
          setStatusFilter("");
          setPoliceFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || buildingFilter || statusFilter || policeFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
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

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Lease Status</InputLabel>
          <Select
            value={statusFilter}
            label="Lease Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value={STATUSES.TENANT.ACTIVE}>Active Leases</MenuItem>
            <MenuItem value={STATUSES.TENANT.MOVED_OUT}>Moved Out</MenuItem>
            <MenuItem value={STATUSES.TENANT.TERMINATED}>Terminated</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Verification</InputLabel>
          <Select
            value={policeFilter}
            label="Verification"
            onChange={(e) => {
              setPoliceFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Verifications</MenuItem>
            <MenuItem value="VERIFIED">Verified</MenuItem>
            <MenuItem value="PENDING">Pending Verification</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          title="No registered tenants found"
          description="Onboard your first tenant or adjust active filter criteria."
          action={
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>
              Onboard First Tenant
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredTenants.map((tenant) => {
            const tId = tenant.id || tenant._id;
            const initials = `${tenant.user?.firstName?.[0] || ""}${tenant.user?.lastName?.[0] || ""}`.toUpperCase() || "T";
            const isVerified = tenant.policeVerificationStatus === "VERIFIED";

            return (
              <Grid item xs={12} sm={6} md={4} key={tId}>
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
                      <StatusChip status={tenant.status} />
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, mb: 0.25 }}>
                      {tenant.user?.firstName} {tenant.user?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 2 }} noWrap>
                      {tenant.user?.email}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Leased Unit
                        </Typography>
                        <Chip
                          label={tenant.policeVerificationStatus || "PENDING"}
                          size="small"
                          sx={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            bgcolor: isVerified ? "#F0FDF4" : "#FFFBEB",
                            color: isVerified ? "#16A34A" : "#D97706",
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                        Flat {tenant.flat?.flatNumber || tenant.flatId || "-"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        {tenant.building?.name || "Al-Raziq Heights"}
                      </Typography>

                      <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Rent Rate
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
                          {formatCurrency(tenant.rentAmount || tenant.monthlyRent || 0)}/mo
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Expires: {new Date(tenant.leaseEndDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedTenant(tenant)}
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
                      Lease Details
                    </Button>

                    {tenant.status === STATUSES.TENANT.ACTIVE && (
                      <PermissionGuard permission={PERMISSIONS.TENANT_MANAGE}>
                        <Tooltip title="Initiate Checkout (Move-out)">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setMoveOutTenant(tenant)}
                            sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}`, borderRadius: "8px" }}
                          >
                            <ExitToAppIcon fontSize="small" />
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
          rows={filteredTenants}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedTenant(row)}
        />
      )}

      {/* Onboard Tenant Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Onboard Tenant & Execute Lease Contract
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {onboardMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {onboardMutation.error?.response?.data?.message || "Failed to onboard tenant."}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Tenant Profile & Unit Assignment
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.userId)}>
                  <InputLabel>Select Tenant User Account</InputLabel>
                  <Select label="Select Tenant User Account" defaultValue="" {...register("userId")}>
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

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.flatId)}>
                  <InputLabel>Leased Flat Unit</InputLabel>
                  <Select label="Leased Flat Unit" defaultValue="" {...register("flatId")}>
                    {availableFlats.map((f) => (
                      <MenuItem key={f.id || f._id} value={f.id || f._id}>
                        Flat {f.flatNumber} (Floor {f.floor?.floorNumber || "-"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.ownerId)}>
                  <InputLabel>Property Owner (Landlord)</InputLabel>
                  <Select label="Property Owner (Landlord)" defaultValue="" {...register("ownerId")}>
                    {availableOwners.map((o) => (
                      <MenuItem key={o.id || o._id} value={o.id || o._id}>
                        {o.user?.firstName} {o.user?.lastName} ({o.user?.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Lease Agreement Terms & Security
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Lease Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.leaseStartDate)}
                  helperText={errors.leaseStartDate?.message}
                  {...register("leaseStartDate")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Lease End Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.leaseEndDate)}
                  helperText={errors.leaseEndDate?.message}
                  {...register("leaseEndDate")}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Monthly Rent (PKR)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.rentAmount)}
                  helperText={errors.rentAmount?.message}
                  {...register("rentAmount")}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Security Deposit (PKR)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.securityDeposit)}
                  helperText={errors.securityDeposit?.message}
                  {...register("securityDeposit")}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Police Verification</InputLabel>
                  <Select
                    label="Police Verification"
                    defaultValue="PENDING"
                    {...register("policeVerificationStatus")}
                  >
                    <MenuItem value="PENDING">Pending Verification</MenuItem>
                    <MenuItem value="VERIFIED">Verified & Cleared</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Emergency Contact (Required)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Contact Name"
                  size="small"
                  fullWidth
                  error={Boolean(errors.emergencyContact?.name)}
                  helperText={errors.emergencyContact?.name?.message}
                  {...register("emergencyContact.name")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Relationship (e.g. Spouse)"
                  size="small"
                  fullWidth
                  error={Boolean(errors.emergencyContact?.relationship)}
                  helperText={errors.emergencyContact?.relationship?.message}
                  {...register("emergencyContact.relationship")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Phone Number (E.164)"
                  placeholder="+923001234567"
                  size="small"
                  fullWidth
                  error={Boolean(errors.emergencyContact?.phone)}
                  helperText={errors.emergencyContact?.phone?.message || "Include + country code prefix"}
                  {...register("emergencyContact.phone")}
                />
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
              disabled={onboardMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {onboardMutation.isPending ? "Executing Lease..." : "Complete Tenant Onboarding"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Tenant Lease Inspection Modal */}
      <Dialog
        open={Boolean(selectedTenant)}
        onClose={() => setSelectedTenant(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700 }}>
              {selectedTenant?.user?.firstName?.[0] || "T"}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                {selectedTenant?.user?.firstName} {selectedTenant?.user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {selectedTenant?.user?.email} • {selectedTenant?.user?.phone || "No phone registered"}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Lease Contract Summary
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    Flat {selectedTenant?.flat?.flatNumber || selectedTenant?.flatId || "-"}
                  </Typography>
                  <StatusChip status={selectedTenant?.status} />
                </Box>
                <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 1.5 }}>
                  {selectedTenant?.building?.name || "Al-Raziq Heights"}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Monthly Rent
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
                      {formatCurrency(selectedTenant?.rentAmount || selectedTenant?.monthlyRent || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Security Deposit Held
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                      {formatCurrency(selectedTenant?.securityDeposit || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Lease Period & Police Clearance
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary, mb: 1 }}>
                  Effective: {new Date(selectedTenant?.leaseStartDate).toLocaleDateString()} to {new Date(selectedTenant?.leaseEndDate).toLocaleDateString()}
                </Typography>
                <Chip
                  label={`Police Verification: ${selectedTenant?.policeVerificationStatus || "PENDING"}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    bgcolor: selectedTenant?.policeVerificationStatus === "VERIFIED" ? "#F0FDF4" : "#FFFBEB",
                    color: selectedTenant?.policeVerificationStatus === "VERIFIED" ? "#16A34A" : "#D97706",
                  }}
                />
              </Paper>
            </Box>

            {selectedTenant?.emergencyContact && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                  Emergency Contact
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    {selectedTenant.emergencyContact.name} ({selectedTenant.emergencyContact.relationship})
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    {selectedTenant.emergencyContact.phone}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedTenant(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Lease Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move-Out Checkout Confirm */}
      <ConfirmDialog
        open={Boolean(moveOutTenant)}
        title="Execute Tenant Move-Out Checkout"
        description={`Are you sure you want to checkout ${moveOutTenant?.user?.firstName} ${moveOutTenant?.user?.lastName} from Flat ${moveOutTenant?.flat?.flatNumber || moveOutTenant?.flatId}? The flat status will be transitioned back to VACANT for new lease allocations.`}
        confirmLabel="Confirm Checkout"
        confirmColor="error"
        isLoading={moveOutMutation.isPending}
        onConfirm={handleMoveOutConfirm}
        onCancel={() => setMoveOutTenant(null)}
      />
    </Box>
  );
};

export default TenantsListPage;
