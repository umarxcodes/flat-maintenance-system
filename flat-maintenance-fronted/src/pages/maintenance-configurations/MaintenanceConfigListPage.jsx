// =====================  MAINTENANCE CONFIGURATION PAGE (LIVE-CALCULATING BUILDER)  =======
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
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useActiveMaintenanceConfig,
  usePublishMaintenanceConfigMutation,
} from "../../features/maintenance-configurations/hooks/use-maintenance-configurations.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

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

/**
 * High-value craft component mandated by Module 14:
 * Live-calculating example card showing exact real-world impact of rate formulas
 */
export const LiveCalculatingExampleCard = ({
  chargeType = "FLAT_RATE",
  baseRate = 2500,
  parkingCharge = 500,
  waterCharge = 300,
  sinkingFundCharge = 200,
  lateFeePercentage = 5,
  gracePeriodDays = 10,
  title = "Live Formula Calculation Simulation",
  defaultArea = 1200,
}) => {
  const [flatArea, setFlatArea] = useState(defaultArea);

  const numBase = Number(baseRate) || 0;
  const numParking = Number(parkingCharge) || 0;
  const numWater = Number(waterCharge) || 0;
  const numSinking = Number(sinkingFundCharge) || 0;
  const numLatePct = Number(lateFeePercentage) || 0;

  const baseTotal = chargeType === "PER_SQFT" ? flatArea * numBase : numBase;
  const monthlyTotal = baseTotal + numParking + numWater + numSinking;
  const lateFeeAmount = Math.round((monthlyTotal * numLatePct) / 100);
  const totalWithLateFee = monthlyTotal + lateFeeAmount;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: "14px",
        borderColor: DESIGN_TOKENS.line[200],
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
          }}
        >
          {title}
        </Typography>
        <Chip
          label="Live Simulation"
          size="small"
          sx={{
            height: 22,
            fontSize: "0.6875rem",
            fontWeight: 600,
            bgcolor: "#ECFDF5",
            color: "#047857",
            borderRadius: "999px",
          }}
        />
      </Box>

      {/* Hero Sentence from Module 14: "A 1,200 sq ft flat would be billed ₨X this month" */}
      <Box
        sx={{
          p: 2,
          borderRadius: "10px",
          bgcolor: "rgba(67, 56, 202, 0.05)",
          border: "1px solid rgba(67, 56, 202, 0.15)",
          mb: 2.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.9375rem",
            color: DESIGN_TOKENS.text.primary,
            lineHeight: 1.5,
          }}
        >
          A <strong>{flatArea.toLocaleString()} sq ft</strong> flat would be billed{" "}
          <strong style={{ color: DESIGN_TOKENS.brand[600], fontSize: "1.125rem" }}>
            ₨{monthlyTotal.toLocaleString()}
          </strong>{" "}
          this month.
        </Typography>
      </Box>

      {/* Interactive SqFt Selector */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography
            variant="caption"
            sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
          >
            Sample Flat Area
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
            {flatArea.toLocaleString()} sq ft
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {[850, 1200, 1650, 2200].map((sqft) => (
            <Button
              key={sqft}
              size="small"
              variant={flatArea === sqft ? "contained" : "outlined"}
              onClick={() => setFlatArea(sqft)}
              sx={{
                flex: 1,
                py: 0.5,
                fontSize: "0.75rem",
                fontWeight: 600,
                borderColor: DESIGN_TOKENS.line[200],
                ...(flatArea === sqft
                  ? { bgcolor: DESIGN_TOKENS.brand[600] }
                  : { color: DESIGN_TOKENS.text.secondary }),
              }}
            >
              {sqft} sf
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Itemized Line Items */}
      <Stack spacing={1} sx={{ pt: 1, borderTop: "1px solid #F1F5F9" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Base Maintenance {chargeType === "PER_SQFT" ? `(${flatArea}sf × ₨${numBase})` : ""}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
            ₨{baseTotal.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Parking Bay Charge
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
            ₨{numParking.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Water Levy
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
            ₨{numWater.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Sinking Fund Contribution
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
            ₨{numSinking.toLocaleString()}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            pt: 1,
            mt: 0.5,
            borderTop: "1px dashed #E2E8F0",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
            Regular Monthly Due
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
            ₨{monthlyTotal.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.5 }}>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.danger[600] }}>
            Late Fee after {gracePeriodDays} days (+{numLatePct}%)
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.danger[600] }}>
            ₨{totalWithLateFee.toLocaleString()}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export const MaintenanceConfigListPage = () => {
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const activeBuildingId = selectedBuildingId || buildings[0]?.id || buildings[0]?._id;

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

  const formValues = watch();

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
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                fontWeight: 600,
              }}
            >
              Rate History
            </Button>
            <PermissionGuard permission={PERMISSIONS.CONFIG_CREATE}>
              <Button
                variant="contained"
                startIcon={<TuneIcon />}
                onClick={handleOpenPublish}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Publish New Formula
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Building Scope Filter */}
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: "12px", borderColor: DESIGN_TOKENS.line[200] }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
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
      {isLoading ? (
        <TableLoadingSkeleton rows={3} />
      ) : !activeConfig ? (
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
            <Paper
              variant="outlined"
              sx={{ p: 3.5, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: FONT_UI }}>
                  Authoritative Active Rate Breakdown
                </Typography>
                <Chip
                  label="ACTIVE"
                  color="success"
                  size="small"
                  sx={{ borderRadius: "999px", fontWeight: 600 }}
                />
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Calculation Strategy
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: FONT_UI }}>
                    {activeConfig.chargeType === "FLAT_RATE"
                      ? "Flat Fixed Rate"
                      : "Per Square Foot"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Base Monthly Charge
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600], fontFamily: FONT_UI }}
                  >
                    ₨{activeConfig.baseRate?.toLocaleString()}
                    {activeConfig.chargeType === "PER_SQFT" ? "/sqft" : ""}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Parking Bay Charge
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₨{activeConfig.parkingCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Water Levy
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₨{activeConfig.waterCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sinking Fund Contribution
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₨{activeConfig.sinkingFundCharge?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Late Payment Penalty
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: DESIGN_TOKENS.danger[600] }}
                  >
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

          {/* Module 14: Live Calculating Example Card on Active Config */}
          <Grid item xs={12} md={5}>
            <LiveCalculatingExampleCard
              chargeType={activeConfig.chargeType}
              baseRate={activeConfig.baseRate}
              parkingCharge={activeConfig.parkingCharge}
              waterCharge={activeConfig.waterCharge}
              sinkingFundCharge={activeConfig.sinkingFundCharge}
              lateFeePercentage={activeConfig.lateFeePercentage}
              gracePeriodDays={activeConfig.gracePeriodDays}
              title="Active Formula Calculation"
            />
          </Grid>
        </Grid>
      )}

      {/* Publish Configuration Dialog with Interactive Live Calculation */}
      <Dialog open={isPublishOpen} onClose={() => setIsPublishOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: FONT_UI }}>
          Publish New Billing Formula
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onPublishSubmit)} noValidate>
          <DialogContent dividers>
            {publishMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {publishMutation.error?.message || "Failed to publish maintenance configuration."}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Left Column: Form Controls */}
              <Grid item xs={12} md={7}>
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
                      label="Base Charge (₨)"
                      type="number"
                      fullWidth
                      error={Boolean(errors.baseRate)}
                      helperText={errors.baseRate?.message}
                      {...register("baseRate")}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Parking Charge (₨)"
                      type="number"
                      fullWidth
                      error={Boolean(errors.parkingCharge)}
                      helperText={errors.parkingCharge?.message}
                      {...register("parkingCharge")}
                    />

                    <TextField
                      label="Water Charge (₨)"
                      type="number"
                      fullWidth
                      error={Boolean(errors.waterCharge)}
                      helperText={errors.waterCharge?.message}
                      {...register("waterCharge")}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Sinking Fund (₨)"
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
              </Grid>

              {/* Right Column: Live Calculating Card during builder edit */}
              <Grid item xs={12} md={5}>
                <LiveCalculatingExampleCard
                  chargeType={formValues.chargeType}
                  baseRate={formValues.baseRate}
                  parkingCharge={formValues.parkingCharge}
                  waterCharge={formValues.waterCharge}
                  sinkingFundCharge={formValues.sinkingFundCharge}
                  lateFeePercentage={formValues.lateFeePercentage}
                  gracePeriodDays={formValues.gracePeriodDays}
                  title="Formula Preview"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPublishOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={publishMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              }}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish Configuration"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MaintenanceConfigListPage;
