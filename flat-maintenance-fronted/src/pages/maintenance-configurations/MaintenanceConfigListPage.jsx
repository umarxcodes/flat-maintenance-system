// =====================  MAINTENANCE CONFIGURATION PAGE  =======
import React, { useState } from "react";
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
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TuneIcon from "@mui/icons-material/Tune";
import HistoryIcon from "@mui/icons-material/History";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useActiveMaintenanceConfig, usePublishMaintenanceConfigMutation } from "../../features/maintenance-configurations/hooks/use-maintenance-configurations.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const configSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  chargeType: z.enum(["FLAT_RATE", "PER_SQFT"]),
  baseRate: z.coerce.number().positive("Base rate must be positive"),
  parkingCharge: z.coerce.number().min(0, "Parking charge must be >= 0"),
  waterCharge: z.coerce.number().min(0, "Water charge must be >= 0"),
  sinkingFundCharge: z.coerce.number().min(0, "Sinking fund charge must be >= 0"),
  lateFeePercentage: z.coerce.number().min(0).max(100, "Percentage must be 0-100"),
  gracePeriodDays: z.coerce.number().min(0, "Grace period must be >= 0"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
});

export const MaintenanceConfigListPage = () => {
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const activeBuildingId = selectedBuildingId || (buildings[0]?.id || buildings[0]?._id);

  const { data: activeConfig, isLoading } = useActiveMaintenanceConfig(activeBuildingId);
  const publishMutation = usePublishMaintenanceConfigMutation();

  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      buildingId: activeBuildingId || "",
      chargeType: "FLAT_RATE",
      baseRate: 2500,
      parkingCharge: 500,
      waterCharge: 300,
      sinkingFundCharge: 200,
      lateFeePercentage: 5,
      gracePeriodDays: 10,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  });

  const previewChargeType = watch("chargeType");
  const previewBaseRate = watch("baseRate") || 0;
  const previewParking = watch("parkingCharge") || 0;
  const previewWater = watch("waterCharge") || 0;
  const previewSinking = watch("sinkingFundCharge") || 0;

  const handleOpenPublish = () => {
    reset({
      buildingId: activeBuildingId,
      chargeType: "FLAT_RATE",
      baseRate: 2500,
      parkingCharge: 500,
      waterCharge: 300,
      sinkingFundCharge: 200,
      lateFeePercentage: 5,
      gracePeriodDays: 10,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    });
    setIsPublishOpen(true);
  };

  const onPublishSubmit = (values) => {
    publishMutation.mutate(values, {
      onSuccess: () => {
        setIsPublishOpen(false);
      },
    });
  };

  return (
    <Box>
      <PageHeader
        title="Maintenance Billing Configurations"
        subtitle="Manage billing formulas, parking levies, sinking funds, and grace periods"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Maintenance Configurations" },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              component={RouterLink}
              to={`/maintenance-configurations/history?buildingId=${activeBuildingId}`}
              variant="outlined"
              startIcon={<HistoryIcon />}
            >
              Rate History
            </Button>
            <PermissionGuard permission={PERMISSIONS.CONFIG_CREATE}>
              <Button variant="contained" startIcon={<TuneIcon />} onClick={handleOpenPublish}>
                Publish New Formula
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Building Scope Filter */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Active Complex Scope:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <Select
              value={activeBuildingId || ""}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              {buildings.map((b) => (
                <MenuItem key={b.id || b._id} value={b.id || b._id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Active Rate Card */}
      {!activeConfig ? (
        <EmptyState
          title="No Active Maintenance Configuration"
          description="There is no active maintenance billing formula published for this building complex."
          action={
            <PermissionGuard permission={PERMISSIONS.CONFIG_CREATE}>
              <Button variant="contained" onClick={handleOpenPublish}>
                Publish Initial Configuration
              </Button>
            </PermissionGuard>
          }
        />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 3.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Authoritative Active Rate Breakdown
                </Typography>
                <Chip label="ACTIVE" color="success" size="small" />
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Calculation Strategy
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {activeConfig.chargeType === "FLAT_RATE" ? "Flat Fixed Rate" : "Per Square Foot"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Base Monthly Charge
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                    ${activeConfig.baseRate?.toLocaleString()}
                    {activeConfig.chargeType === "PER_SQFT" ? "/sqft" : ""}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Parking Bay Charge
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ${activeConfig.parkingCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Water Levy
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ${activeConfig.waterCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sinking Fund Contribution
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ${activeConfig.sinkingFundCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Late Payment Penalty
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "error.main" }}>
                    {activeConfig.lateFeePercentage}%
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Grace Period Days
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {activeConfig.gracePeriodDays} days
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Effective From
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {activeConfig.effectiveFrom ? activeConfig.effectiveFrom.slice(0, 10) : "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3.5, bgcolor: "action.hover" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                <CalculateOutlinedIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Billing Formula Rule
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" paragraph>
                Whenever invoices are generated, the server evaluates:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  fontFamily: "monospace",
                  fontSize: "0.8125rem",
                  mb: 2,
                }}
              >
                Total = Base Rate + Parking + Water + Sinking Fund
              </Box>
              <Typography variant="caption" color="text.secondary">
                Late fees are calculated after grace period expires from due date. All calculations are authoritative on the backend.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Publish Configuration Dialog */}
      <Dialog open={isPublishOpen} onClose={() => setIsPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Publish New Billing Formula</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onPublishSubmit)} noValidate>
          <DialogContent dividers>
            {publishMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {publishMutation.error?.message || "Failed to publish maintenance configuration."}
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Charge Strategy</InputLabel>
                  <Select label="Charge Strategy" {...register("chargeType")}>
                    <MenuItem value="FLAT_RATE">Fixed Flat Rate</MenuItem>
                    <MenuItem value="PER_SQFT">Per Square Foot</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Base Charge ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.baseRate)}
                  helperText={errors.baseRate?.message}
                  {...register("baseRate")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Parking Charge ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.parkingCharge)}
                  helperText={errors.parkingCharge?.message}
                  {...register("parkingCharge")}
                />

                <TextField
                  label="Water Charge ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.waterCharge)}
                  helperText={errors.waterCharge?.message}
                  {...register("waterCharge")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Sinking Fund ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.sinkingFundCharge)}
                  helperText={errors.sinkingFundCharge?.message}
                  {...register("sinkingFundCharge")}
                />

                <TextField
                  label="Late Fee (%)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.lateFeePercentage)}
                  helperText={errors.lateFeePercentage?.message}
                  {...register("lateFeePercentage")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Grace Period (Days)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.gracePeriodDays)}
                  helperText={errors.gracePeriodDays?.message}
                  {...register("gracePeriodDays")}
                />

                <TextField
                  label="Effective From"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.effectiveFrom)}
                  helperText={errors.effectiveFrom?.message}
                  {...register("effectiveFrom")}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPublishOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publishing..." : "Publish Configuration"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MaintenanceConfigListPage;
