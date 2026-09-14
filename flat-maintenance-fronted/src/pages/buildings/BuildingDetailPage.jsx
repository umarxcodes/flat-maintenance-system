// =====================  BUILDING DETAIL PAGE (AUTHORITATIVE MASTER SPEC)  ================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DomainIcon from "@mui/icons-material/Domain";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useBuildingDetail,
  useUpdateBuildingMutation,
} from "../../features/buildings/hooks/use-buildings.js";
import { useBlocksList } from "../../features/blocks/hooks/use-blocks.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

const BUILDING_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

const updateBuildingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Building name must be at least 2 characters")
    .max(128, "Building name cannot exceed 128 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .min(2, "Building code must be at least 2 characters")
    .max(50, "Building code cannot exceed 50 characters")
    .regex(
      BUILDING_CODE_REGEX,
      "Building code must contain only letters, numbers, hyphens, or underscores"
    )
    .optional(),
  address: z
    .object({
      street: z.string().trim().min(2, "Street must be at least 2 characters").max(200).optional(),
      city: z.string().trim().min(2, "City must be at least 2 characters").max(100).optional(),
      state: z.string().trim().min(2, "State must be at least 2 characters").max(100).optional(),
      postalCode: z
        .string()
        .trim()
        .min(2, "Postal code must be at least 2 characters")
        .max(20)
        .optional(),
      country: z
        .string()
        .trim()
        .min(2, "Country must be at least 2 characters")
        .max(100)
        .optional(),
    })
    .optional(),
  totalBlocks: z.coerce.number().int().min(0).optional(),
  totalFlats: z.coerce.number().int().min(0).optional(),
  status: z.enum(Object.values(STATUSES.BUILDING)).optional(),
});

export const BuildingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: building, isLoading, refetch } = useBuildingDetail(id);
  const { data: blocksData } = useBlocksList({ buildingId: id });
  const { data: flatsData } = useFlatsList({ buildingId: id, limit: 50 });
  const { data: usersData } = useUsersList({ buildingId: id });
  const { data: auditData } = useAuditLogsList({ buildingId: id, limit: 10 });
  const updateMutation = useUpdateBuildingMutation();

  const blocks = blocksData?.blocks || (Array.isArray(blocksData) ? blocksData : []);
  const flats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);
  const assignedAdmins = (usersData?.users || (Array.isArray(usersData) ? usersData : [])).filter(
    (u) => u.role === "BUILDING_ADMIN" || u.role === "MANAGER"
  );
  const recentLogs = auditData?.logs || (Array.isArray(auditData) ? auditData : []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateBuildingSchema),
  });

  const handleOpenEdit = () => {
    reset({
      name: building?.name || "",
      code: building?.code || "",
      address: {
        street: building?.address?.street || "",
        city: building?.address?.city || "",
        state: building?.address?.state || "",
        postalCode: building?.address?.postalCode || "",
        country: building?.address?.country || "Pakistan",
      },
      totalBlocks: building?.totalBlocks || blocks.length || 0,
      totalFlats: building?.totalFlats || flats.length || 0,
      status: building?.status || STATUSES.BUILDING.ACTIVE,
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  const onUpdateSubmit = (values) => {
    updateMutation.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          handleCloseEdit();
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={3} />
      </Box>
    );
  }

  const stats = building?.statistics || {};
  const totalFlats = stats.totalFlats || building?.totalFlats || flats.length || 0;
  const occupiedFlats = stats.occupiedFlats ?? flats.filter((f) => f.status === "OCCUPIED").length;
  const vacantFlats = stats.vacantFlats ?? flats.filter((f) => f.status === "VACANT").length;
  const maintenanceFlats = flats.filter((f) => f.status === "UNDER_MAINTENANCE").length;
  const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title={building?.name || "Building Complex"}
        subtitle={`Code: ${building?.code || "—"} • ID: ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: building?.name || "Details" },
        ]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/buildings")}
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                fontWeight: 600,
                "&:hover": {
                  borderColor: DESIGN_TOKENS.line[300],
                  bgcolor: DESIGN_TOKENS.surface[50],
                },
              }}
            >
              Back to Buildings
            </Button>
            <PermissionGuard permission={PERMISSIONS.BUILDING_UPDATE}>
              <Button
                variant="contained"
                startIcon={<EditOutlinedIcon />}
                onClick={handleOpenEdit}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Edit Building
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Header Info Card */}
      <Paper
        variant="outlined"
        sx={{
          p: 3.5,
          borderRadius: "14px",
          borderColor: DESIGN_TOKENS.line[200],
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          mb: 3.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
                letterSpacing: "-0.015em",
                mb: 0.5,
              }}
            >
              {building?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
              {building?.address?.street || "—"}, {building?.address?.city || "—"},{" "}
              {building?.address?.state || "—"} {building?.address?.postalCode || ""},{" "}
              {building?.address?.country || "Pakistan"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusChip status={building?.status || STATUSES.BUILDING.ACTIVE} />
          </Stack>
        </Box>

        {/* Canonical StatCard Row */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={building?.totalBlocks ?? blocks.length}
              label="Total Blocks / Towers"
              delta="Physical tower structures"
              icon={<ApartmentOutlinedIcon />}
              iconBg="#EEF2FF"
              iconColor={DESIGN_TOKENS.brand[600]}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={totalFlats}
              label="Total Residential Flats"
              delta={`${occupiedFlats} occupied • ${vacantFlats} vacant`}
              icon={<MeetingRoomOutlinedIcon />}
              iconBg="#ECFDF5"
              iconColor="#059669"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={`${occupancyRate}%`}
              label="Occupancy Rate"
              delta={`${occupiedFlats} of ${totalFlats} flats occupied`}
              isHero={true}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Stacked Tabs */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: "14px",
          borderColor: DESIGN_TOKENS.line[200],
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          sx={{
            px: 3,
            pt: 1,
            borderBottom: "1px solid",
            borderColor: DESIGN_TOKENS.line[200],
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
            },
          }}
        >
          <Tab
            icon={<DomainIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Blocks & Flats Structure"
          />
          <Tab
            icon={<PersonOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Assigned Admins (${assignedAdmins.length})`}
          />
          <Tab
            icon={<HistoryEduIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Recent Activity"
          />
        </Tabs>

        <Box sx={{ p: 3.5 }}>
          {/* Tab 0: Structure Summary (Blocks & Flats) */}
          {activeTab === 0 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_UI,
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      color: "#0F172A",
                    }}
                  >
                    Towers & Blocks in this Complex
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25 }}
                  >
                    Individual tower divisions, floor distribution, and flat units
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to={`/blocks?buildingId=${id}`}
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: DESIGN_TOKENS.brand[600],
                  }}
                >
                  Manage All Blocks
                </Button>
              </Box>

              {blocks.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    bgcolor: DESIGN_TOKENS.surface[50],
                    borderRadius: "12px",
                    border: `1px dashed ${DESIGN_TOKENS.line[200]}`,
                    mb: 4,
                  }}
                >
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    No blocks set up for this building yet. Add a block to begin mapping floors and
                    flats.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/blocks"
                    variant="contained"
                    size="small"
                    sx={{
                      mt: 1.5,
                      bgcolor: DESIGN_TOKENS.brand[600],
                      fontWeight: 600,
                    }}
                  >
                    Add Block / Tower
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                  {blocks.map((block) => (
                    <Grid item xs={12} sm={6} md={4} key={block._id || block.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: "12px",
                          borderColor: DESIGN_TOKENS.line[200],
                          bgcolor: "#FFFFFF",
                          "&:hover": {
                            borderColor: DESIGN_TOKENS.brand[400],
                            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}>
                            {block.name}
                          </Typography>
                          <Chip
                            label={`Code: ${block.code || "—"}`}
                            size="small"
                            sx={{ fontSize: "0.75rem", fontWeight: 600, bgcolor: "#F1F5F9" }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}
                        >
                          Total Floors: {block.totalFloors || 1}
                        </Typography>
                        <Button
                          component={RouterLink}
                          to={`/floors?blockId=${block._id || block.id}`}
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: DESIGN_TOKENS.brand[600],
                            p: 0,
                          }}
                        >
                          View Floors
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Flats Section */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  mt: 3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_UI,
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      color: "#0F172A",
                    }}
                  >
                    Residential Flats ({flats.length})
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25 }}
                  >
                    Occupancy state and unit classifications
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to={`/flats?buildingId=${id}`}
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: DESIGN_TOKENS.brand[600],
                  }}
                >
                  Manage All Flats
                </Button>
              </Box>

              {flats.length === 0 ? (
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    bgcolor: DESIGN_TOKENS.surface[50],
                    borderRadius: "12px",
                    border: `1px dashed ${DESIGN_TOKENS.line[200]}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    No flats registered yet for this complex.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {flats.slice(0, 8).map((flat) => (
                    <Grid item xs={12} sm={6} md={3} key={flat._id || flat.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          borderColor: "#E2E8F0",
                          bgcolor: "#FFFFFF",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                            Flat {flat.flatNumber}
                          </Typography>
                          <StatusChip status={flat.status} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}
                        >
                          Type: {flat.flatType || "2BHK"} •{" "}
                          {flat.areaSqFt ? `${flat.areaSqFt} sq ft` : "—"}
                        </Typography>
                        {flat.blockId?.name && (
                          <Typography
                            variant="caption"
                            sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}
                          >
                            Tower: {flat.blockId.name}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 1: Assigned Admins */}
          {activeTab === 1 && (
            <Box>
              <Typography
                sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem", mb: 2 }}
              >
                Appointed Property Administrators
              </Typography>
              {assignedAdmins.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: DESIGN_TOKENS.text.secondary, py: 3, textAlign: "center" }}
                >
                  No dedicated admins assigned to this building yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {assignedAdmins.map((admin) => (
                    <Box
                      key={admin._id || admin.id}
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        bgcolor: DESIGN_TOKENS.surface[50],
                        border: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {admin.firstName} {admin.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          {admin.email} • Role: {admin.role}
                        </Typography>
                      </Box>
                      <Chip
                        label="Active Operator"
                        size="small"
                        sx={{
                          bgcolor: "#ECFDF5",
                          color: "#047857",
                          fontWeight: 600,
                          fontSize: "0.6875rem",
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Tab 2: Recent Activity */}
          {activeTab === 2 && (
            <Box>
              <Typography
                sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem", mb: 2 }}
              >
                Recent Operational Logs
              </Typography>
              {recentLogs.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: DESIGN_TOKENS.text.secondary, py: 3, textAlign: "center" }}
                >
                  No operational activity logged for this building yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {recentLogs.map((log) => (
                    <Box
                      key={log._id || log.id}
                      sx={{
                        p: 1.75,
                        borderRadius: "10px",
                        bgcolor: DESIGN_TOKENS.surface[50],
                        border: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, fontSize: "0.8125rem" }}
                        >
                          {log.action || "PROPERTY_UPDATE"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Actor: {log.userEmail || "Admin"} •{" "}
                          {log.details?.description || "Building record synced"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "Recent"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Edit Building Modal */}
      <Dialog open={isEditOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Edit Building Configuration
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onUpdateSubmit)} noValidate>
          <DialogContent dividers>
            {updateMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {updateMutation.error?.message || "Failed to update building."}
              </Alert>
            )}

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Building Name"
                  fullWidth
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register("name")}
                />
                <TextField
                  label="Building Code"
                  fullWidth
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message}
                  {...register("code")}
                />
              </Stack>

              <TextField
                label="Street Address"
                fullWidth
                error={Boolean(errors.address?.street)}
                helperText={errors.address?.street?.message}
                {...register("address.street")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="City"
                  fullWidth
                  error={Boolean(errors.address?.city)}
                  helperText={errors.address?.city?.message}
                  {...register("address.city")}
                />
                <TextField
                  label="State / Province"
                  fullWidth
                  error={Boolean(errors.address?.state)}
                  helperText={errors.address?.state?.message}
                  {...register("address.state")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Postal Code"
                  fullWidth
                  error={Boolean(errors.address?.postalCode)}
                  helperText={errors.address?.postalCode?.message}
                  {...register("address.postalCode")}
                />
                <TextField
                  label="Country"
                  fullWidth
                  error={Boolean(errors.address?.country)}
                  helperText={errors.address?.country?.message}
                  {...register("address.country")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Total Blocks / Towers"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  error={Boolean(errors.totalBlocks)}
                  helperText={errors.totalBlocks?.message}
                  {...register("totalBlocks")}
                />
                <TextField
                  label="Total Flats"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  error={Boolean(errors.totalFlats)}
                  helperText={errors.totalFlats?.message}
                  {...register("totalFlats")}
                />
              </Stack>

              <FormControl fullWidth size="small">
                <InputLabel id="edit-status-label">Operational Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  label="Operational Status"
                  defaultValue={building?.status || STATUSES.BUILDING.ACTIVE}
                  {...register("status")}
                >
                  <MenuItem value={STATUSES.BUILDING.ACTIVE}>Active</MenuItem>
                  <MenuItem value={STATUSES.BUILDING.UNDER_CONSTRUCTION}>
                    Under Construction
                  </MenuItem>
                  <MenuItem value={STATUSES.BUILDING.INACTIVE}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseEdit} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BuildingDetailPage;
