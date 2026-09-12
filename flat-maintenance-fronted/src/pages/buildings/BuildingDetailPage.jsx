// =====================  BUILDING DETAIL PAGE  ================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DomainIcon from "@mui/icons-material/Domain";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LayersIcon from "@mui/icons-material/Layers";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import { useBuildingDetail } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const BuildingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: building, isLoading } = useBuildingDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  const stats = building?.statistics || {};

  return (
    <Box>
      <PageHeader
        title={building?.name || "Building Complex"}
        subtitle={`Code: ${building?.code || "-"} • ID: ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: "Details" },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/buildings")}
          >
            Back to Buildings
          </Button>
        }
      />

      {/* Structural Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main" }}>
              <DomainIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Blocks / Towers
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.totalBlocks ?? "-"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.lighter", color: "info.main" }}>
              <LayersIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Floors
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.totalFloors ?? "-"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}>
              <MeetingRoomIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Flats
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.totalFlats ?? "-"}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Building Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Complex Information
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Building Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {building?.name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Building Code
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {building?.code}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Operational Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip status={building?.status || "ACTIVE"} />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Physical Address
            </Typography>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Street Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {building?.address?.street || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  City, State & Postal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {building?.address?.city}, {building?.address?.state} {building?.address?.postalCode}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Country
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {building?.address?.country || "-"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BuildingDetailPage;
