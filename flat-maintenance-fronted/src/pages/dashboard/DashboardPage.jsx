// =====================  ROLE-AWARE DASHBOARD PAGE  ===========
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PeopleIcon from "@mui/icons-material/People";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BuildIcon from "@mui/icons-material/Build";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import CampaignIcon from "@mui/icons-material/Campaign";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../providers/auth-provider.jsx";
import { ROLES, ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";

export const DashboardPage = () => {
  const { user } = useAuth();
  const role = user?.role || ROLES.TENANT;

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.firstName || "Resident"}!`}
        subtitle={`Role: ${ROLE_LABELS[role] || role} • Operational Overview`}
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Role-Specific Metric Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(role === ROLES.SUPER_ADMIN || role === ROLES.BUILDING_ADMIN) && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main" }}>
                      <ApartmentIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Buildings
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Complex Hub
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/buildings"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Manage Buildings
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}>
                      <MeetingRoomIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Flats & Units
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Inventory
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/flats"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All Flats
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.lighter", color: "info.main" }}>
                      <PeopleIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Residents & Staff
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Directory
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/users"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Manage Users
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "warning.lighter", color: "warning.main" }}>
                      <ReceiptLongIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Maintenance
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Billing
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/invoices"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View Invoices
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}

        {(role === ROLES.MANAGER || role === ROLES.MAINTENANCE_STAFF) && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "warning.lighter", color: "warning.main" }}>
                      <BuildIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Maintenance Queue
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Work Orders
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/maintenance-requests"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Open Requests
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "error.lighter", color: "error.main" }}>
                      <ReportProblemIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Grievances
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Complaints
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/complaints"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Review Complaints
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.lighter", color: "info.main" }}>
                      <CampaignIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Broadcasts
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Notices
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/notices"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View Notices
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}

        {(role === ROLES.OWNER || role === ROLES.TENANT) && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main" }}>
                      <ReceiptLongIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Maintenance Bills
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Invoices
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/invoices"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Pay & View History
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "warning.lighter", color: "warning.main" }}>
                      <BuildIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Service Helpdesk
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Maintenance
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/maintenance-requests"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Raise Ticket
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}>
                      <TransferWithinAStationIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Gate Entry Pass
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Visitors
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/visitors"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Create Pass
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}

        {role === ROLES.SECURITY_STAFF && (
          <>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.lighter", color: "info.main" }}>
                      <TransferWithinAStationIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Digital Gate Pass
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Verify Pass Code
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/visitors/verify"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Verify Pass Code
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}>
                      <PeopleIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Gate Security Log
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Active Visitors
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/visitors"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Visitor Register
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Launchpad & Notice Feed */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Operational Directives & System Announcements
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All financial calculations, billing generation, and occupancy status transitions are enforced directly by the authoritative backend core service.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
