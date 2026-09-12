// =====================  REPORTS & ANALYTICS OVERVIEW  ========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SpeedIcon from "@mui/icons-material/Speed";
import EngineeringIcon from "@mui/icons-material/Engineering";
import {
  useMaintenanceCollectionsReport,
  useStaffPerformanceReport,
  useComplaintSlaReport,
} from "../../features/reports/hooks/use-reports.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const ReportsOverviewPage = () => {
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const activeBuildingId = selectedBuildingId || (buildings[0]?.id || buildings[0]?._id);

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const { data: collectionsData, isLoading: isColLoading } = useMaintenanceCollectionsReport({
    buildingId: activeBuildingId,
    period: currentPeriod,
  });

  const { data: staffData, isLoading: isStaffLoading } = useStaffPerformanceReport({
    buildingId: activeBuildingId,
  });

  const { data: slaData, isLoading: isSlaLoading } = useComplaintSlaReport({
    buildingId: activeBuildingId,
  });

  const colStats = collectionsData?.report || collectionsData || {};
  const totalBilled = colStats.totalBilled || 0;
  const totalCollected = colStats.totalCollected || 0;
  const collectionRate = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 0;

  return (
    <Box>
      <PageHeader
        title="Reports & Financial Intelligence"
        subtitle="Authoritative analytics on collections velocity, staff SLA compliance, and grievances"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports" },
        ]}
      />

      {/* Building Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Analyze Building Complex:
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

      {/* Section 1: Maintenance Collections Report */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        1. Maintenance Collections ({currentPeriod})
      </Typography>

      {isColLoading ? (
        <CardLoadingSkeleton count={3} />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                <MonetizationOnIcon color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Total Invoiced
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                ${totalBilled?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                <MonetizationOnIcon color="success" />
                <Typography variant="caption" color="text.secondary">
                  Total Collected
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "success.main" }}>
                ${totalCollected?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }} display="block">
                Collection Efficiency ({collectionRate}%)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={collectionRate}
                    color={collectionRate > 80 ? "success" : "warning"}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {collectionRate}%
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Section 2: Staff Performance & SLA Compliance */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
              <EngineeringIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                2. Operations & Staff Performance
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            {isStaffLoading ? (
              <LinearProgress />
            ) : (
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Completed Work Orders
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {staffData?.completedOrders ?? staffData?.totalTasks ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Resolution Velocity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {staffData?.avgResolutionHours ? `${staffData.avgResolutionHours} hrs` : "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Technician Customer Rating
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
                    ★ {staffData?.avgRating ? staffData.avgRating.toFixed(1) : "5.0"} / 5.0
                  </Typography>
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
              <SpeedIcon color="error" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                3. Complaint SLA & Turnaround Metrics
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            {isSlaLoading ? (
              <LinearProgress />
            ) : (
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Grievances Registered
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {slaData?.totalComplaints ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Resolved within SLA Window
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                    {slaData?.resolvedWithinSla ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    SLA Breach Count
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                    {slaData?.breachCount ?? 0}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsOverviewPage;
