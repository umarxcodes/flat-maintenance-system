// =====================  OWNERS REGISTRY LIST PAGE  ===========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import ContactEmergencyIcon from "@mui/icons-material/ContactEmergency";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOwnersList, useRegisterOwnerMutation } from "../../features/owners/hooks/use-owners.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { ROLES } from "../../lib/constants/roles.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

const ownerFormSchema = z.object({
  userId: z.string().min(1, "Owner user account is required"),
  buildingId: z.string().min(1, "Building complex is required"),
  flatsOwned: z.array(z.string()).default([]),
  isResidingInBuilding: z.boolean().default(false),
  emergencyContact: z.object({
    name: z.string().trim().min(2, "Contact name must be at least 2 characters").max(64),
    relationship: z.string().trim().min(2, "Relationship must be at least 2 characters").max(32),
    phone: z.string().trim().regex(E164_PHONE_REGEX, "Phone must be in E.164 format (e.g. +923001234567)"),
  }),
  idProofType: z.enum(["PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE"]).optional().nullable(),
  idProofUrl: z.string().trim().url("Must be a valid CDN URL").optional().or(z.literal("")),
});

export const OwnersListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [residencyFilter, setResidencyFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: usersData } = useUsersList({ limit: 100 });
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(buildingFilter && { buildingId: buildingFilter }),
    ...(residencyFilter !== "" && { isResidingInBuilding: residencyFilter }),
  };

  const { data, isLoading } = useOwnersList(queryParams);
  const registerMutation = useRegisterOwnerMutation();

  const rawOwners = data?.owners || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawOwners.length;

  const filteredOwners = useMemo(() => {
    if (!search) return rawOwners;
    const q = search.toLowerCase();
    return rawOwners.filter((o) => {
      const name = `${o.user?.firstName || ""} ${o.user?.lastName || ""}`.toLowerCase();
      const email = (o.user?.email || "").toLowerCase();
      const phone = (o.user?.phone || "").toLowerCase();
      const bName = (o.building?.name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || bName.includes(q);
    });
  }, [rawOwners, search]);

  // Metrics
  const residentCount = useMemo(() => rawOwners.filter((o) => o.isResidingInBuilding).length, [rawOwners]);
  const nonResidentCount = rawOwners.length - residentCount;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      flatsOwned: [],
      isResidingInBuilding: false,
      emergencyContact: {
        name: "",
        relationship: "Spouse",
        phone: "+92",
      },
      idProofType: "NATIONAL_ID",
      idProofUrl: "",
    },
  });

  const selectedBuildingId = watch("buildingId");

  // Load flats for deed linking
  const { data: flatsData } = useFlatsList(
    selectedBuildingId ? { buildingId: selectedBuildingId, limit: 100 } : {}
  );
  const availableFlats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);

  const handleOpenRegister = () => {
    reset({
      userId: "",
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
      flatsOwned: [],
      isResidingInBuilding: false,
      emergencyContact: {
        name: "",
        relationship: "Spouse",
        phone: "+923001234567",
      },
      idProofType: "NATIONAL_ID",
      idProofUrl: "",
    });
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    const payload = {
      userId: values.userId,
      buildingId: values.buildingId,
      flatsOwned: values.flatsOwned,
      isResidingInBuilding: values.isResidingInBuilding,
      emergencyContact: values.emergencyContact,
      ...(values.idProofUrl && values.idProofType ? { idProofType: values.idProofType, idProofUrl: values.idProofUrl } : {}),
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseRegister();
      },
    });
  };

  const columns = [
    {
      id: "name",
      label: "Property Owner",
      render: (_, row) => {
        const initials = `${row.user?.firstName?.[0] || ""}${row.user?.lastName?.[0] || ""}`.toUpperCase() || "O";
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
      id: "building",
      label: "Building Complex",
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
          {row.building?.name || "Greenwood Valley"}
        </Typography>
      ),
    },
    {
      id: "flatsOwned",
      label: "Deeded Units",
      render: (val) => {
        const count = val?.length || 0;
        return (
          <Chip
            label={`${count} ${count === 1 ? "Unit" : "Units"}`}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
            }}
          />
        );
      },
    },
    {
      id: "residency",
      label: "Residency Status",
      render: (_, row) => (
        <Chip
          label={row.isResidingInBuilding ? "Resident Owner" : "Off-site Owner"}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: row.isResidingInBuilding ? "#F0FDF4" : "#F8FAFC",
            color: row.isResidingInBuilding ? "#16A34A" : DESIGN_TOKENS.text.secondary,
            border: `1px solid ${row.isResidingInBuilding ? "#BBF7D0" : DESIGN_TOKENS.line[200]}`,
          }}
        />
      ),
    },
    {
      id: "emergencyContact",
      label: "Emergency Contact",
      render: (val) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
            {val?.name || "-"}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            {val?.phone} {val?.relationship ? `(${val.relationship})` : ""}
          </Typography>
        </Box>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSelectedOwner(row)}
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "none",
            borderColor: DESIGN_TOKENS.line[200],
            color: DESIGN_TOKENS.brand[600],
            "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
          }}
        >
          View Deeds
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Property Owners Directory"
        subtitle="Deeded asset portfolio registry, resident ownership governance, and emergency verification"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Owners" }]}
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

            <PermissionGuard permission={PERMISSIONS.OWNER_CREATE}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenRegister}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Register Owner
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
                Total Deeded Owners
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalCount}
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
                Resident Owners
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : residentCount}
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
                bgcolor: "#F8FAFC",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HomeWorkIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Off-site / Investor Owners
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : nonResidentCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search owners by name, email, or building..."
        onReset={() => {
          setSearch("");
          setBuildingFilter("");
          setResidencyFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || buildingFilter || residencyFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Building Complex</InputLabel>
          <Select
            value={buildingFilter}
            label="Building Complex"
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

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Residency</InputLabel>
          <Select
            value={residencyFilter}
            label="Residency"
            onChange={(e) => {
              setResidencyFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="true">Resident Owners</MenuItem>
            <MenuItem value="false">Off-site Owners</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredOwners.length === 0 ? (
        <EmptyState
          title="No registered property owners found"
          description="Register building property deeds or modify your filters."
          action={
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenRegister}>
              Register First Owner
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredOwners.map((owner) => {
            const oId = owner.id || owner._id;
            const initials = `${owner.user?.firstName?.[0] || ""}${owner.user?.lastName?.[0] || ""}`.toUpperCase() || "O";
            const deedCount = owner.flatsOwned?.length || 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={oId}>
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
                      <Avatar sx={{ width: 46, height: 46, bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700, fontSize: "1rem" }}>
                        {initials}
                      </Avatar>
                      <Chip
                        label={owner.isResidingInBuilding ? "Resident Owner" : "Off-site"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: owner.isResidingInBuilding ? "#F0FDF4" : "#F8FAFC",
                          color: owner.isResidingInBuilding ? "#16A34A" : DESIGN_TOKENS.text.secondary,
                          border: `1px solid ${owner.isResidingInBuilding ? "#BBF7D0" : DESIGN_TOKENS.line[200]}`,
                        }}
                      />
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary, mb: 0.25 }}>
                      {owner.user?.firstName} {owner.user?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 2 }} noWrap>
                      {owner.user?.email}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block", mb: 0.5 }}>
                        Building Portfolio
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary, mb: 1 }}>
                        {owner.building?.name || "Greenwood Valley Residences"}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${deedCount} Deeded ${deedCount === 1 ? "Unit" : "Units"}`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            bgcolor: DESIGN_TOKENS.brand[50],
                            color: DESIGN_TOKENS.brand[600],
                          }}
                        />
                      </Stack>
                    </Box>

                    {owner.emergencyContact?.name && (
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        Emergency: {owner.emergencyContact.name} ({owner.emergencyContact.phone})
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedOwner(owner)}
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
                      Inspect Portfolio
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
          rows={filteredOwners}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedOwner(row)}
        />
      )}

      {/* Register Owner Modal */}
      <Dialog
        open={isRegisterOpen}
        onClose={handleCloseRegister}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Register Property Owner Deed Profile
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {registerMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {registerMutation.error?.response?.data?.message || "Failed to register property owner."}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Owner Identity & Complex Association
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

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Deeded Flats Selection (Multi-Unit Ownership)
            </Typography>

            <Controller
              name="flatsOwned"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Deeded Flats</InputLabel>
                  <Select
                    multiple
                    label="Deeded Flats"
                    value={field.value}
                    onChange={field.onChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((val) => {
                          const flatObj = availableFlats.find((f) => (f.id || f._id) === val);
                          return <Chip key={val} label={flatObj?.flatNumber || val} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {availableFlats.map((flat) => (
                      <MenuItem key={flat.id || flat._id} value={flat.id || flat._id}>
                        Flat {flat.flatNumber} (Floor {flat.floor?.floorNumber || "-"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="isResidingInBuilding"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Owner resides on premises within this building complex"
                />
              )}
            />

            <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Emergency Verification Contact (Required)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Contact Full Name"
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

            <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
              Identity Document Proof (Optional)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>ID Document Type</InputLabel>
                  <Select label="ID Document Type" defaultValue="NATIONAL_ID" {...register("idProofType")}>
                    <MenuItem value="NATIONAL_ID">National Identity Card (CNIC / SSN)</MenuItem>
                    <MenuItem value="PASSPORT">Passport</MenuItem>
                    <MenuItem value="DRIVING_LICENSE">Driving License</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Document Image / CDN URL"
                  placeholder="https://res.cloudinary.com/..."
                  size="small"
                  fullWidth
                  error={Boolean(errors.idProofUrl)}
                  helperText={errors.idProofUrl?.message}
                  {...register("idProofUrl")}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={handleCloseRegister} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={registerMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {registerMutation.isPending ? "Registering..." : "Complete Owner Registration"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Owner Portfolio Inspection Modal */}
      <Dialog
        open={Boolean(selectedOwner)}
        onClose={() => setSelectedOwner(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700 }}>
              {selectedOwner?.user?.firstName?.[0] || "O"}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                {selectedOwner?.user?.firstName} {selectedOwner?.user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {selectedOwner?.user?.email} • {selectedOwner?.user?.phone || "No phone"}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Complex & Residency Status
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary, mb: 0.5 }}>
                  {selectedOwner?.building?.name || "Greenwood Valley Residences"}
                </Typography>
                <Chip
                  label={selectedOwner?.isResidingInBuilding ? "Resident Owner (Lives on-premises)" : "Off-site Owner (Investor / Landlord)"}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    bgcolor: selectedOwner?.isResidingInBuilding ? "#F0FDF4" : "#FFFFFF",
                    color: selectedOwner?.isResidingInBuilding ? "#16A34A" : DESIGN_TOKENS.text.secondary,
                    border: `1px solid ${selectedOwner?.isResidingInBuilding ? "#BBF7D0" : DESIGN_TOKENS.line[200]}`,
                  }}
                />
              </Paper>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                Deeded Flats Portfolio ({selectedOwner?.flatsOwned?.length || 0})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {selectedOwner?.flatsOwned && selectedOwner.flatsOwned.length > 0 ? (
                  selectedOwner.flatsOwned.map((flat, idx) => (
                    <Chip
                      key={flat._id || flat.id || idx}
                      label={`Flat ${flat.flatNumber || flat}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        bgcolor: DESIGN_TOKENS.brand[50],
                        color: DESIGN_TOKENS.brand[600],
                        border: `1px solid ${DESIGN_TOKENS.brand[600]}20`,
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    No individual flats linked to this deed profile yet.
                  </Typography>
                )}
              </Stack>
            </Box>

            {selectedOwner?.emergencyContact && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: DESIGN_TOKENS.brand[600], display: "block", mb: 1 }}>
                  Emergency Contact Verification
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    {selectedOwner.emergencyContact.name} ({selectedOwner.emergencyContact.relationship})
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    {selectedOwner.emergencyContact.phone}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedOwner(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Portfolio
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OwnersListPage;
