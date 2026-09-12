// =====================  FLAT DETAIL PAGE  ====================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import { useFlatDetail } from "../../features/flats/hooks/use-flats.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const FlatDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: flat, isLoading } = useFlatDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Flat Unit ${flat?.flatNumber || id}`}
        subtitle={`${flat?.flatType || "-"} • ${flat?.areaSqFt || "-"} Sq Ft • ID: ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Flats", href: "/flats" },
          { label: "Details" },
        ]}
        action={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/flats")}>
            Back to Flats
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Unit Specifications
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Flat / Unit Number
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {flat?.flatNumber}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Configuration & Layout
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {flat?.flatType}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Area (Square Footage)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {flat?.areaSqFt} sq ft
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Occupancy Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip status={flat?.status || "VACANT"} />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Location in Complex
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Building Complex
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {flat?.building?.name || flat?.buildingId || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Block / Tower
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {flat?.block?.name || flat?.blockId || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Floor Level
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Level {flat?.floor?.floorNumber ?? "-"}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Current Occupant Allocation
            </Typography>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Assigned Owner
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {flat?.currentOwner ? `${flat.currentOwner.firstName} ${flat.currentOwner.lastName}` : "None Assigned"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active Tenant / Lease
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {flat?.currentTenant ? `${flat.currentTenant.firstName} ${flat.currentTenant.lastName}` : "Vacant / No Active Lease"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FlatDetailPage;
