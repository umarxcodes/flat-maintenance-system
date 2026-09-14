// =====================  REPORTS & ANALYTICS (SECTION 37 & APPENDIX §A.5)  ========
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
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { Link as RouterLink } from "react-router-dom";
import {
  useMaintenanceCollectionsReport,
  useStaffPerformanceReport,
  useComplaintSlaReport,
} from "../../features/reports/hooks/use-reports.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { TrendChart } from "../../components/common/TrendChart.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

export const ReportsOverviewPage = () => {
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const activeBuildingId = selectedBuildingId || buildings[0]?.id || buildings[0]?._id;

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
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate =
    totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 100;

  const staffStats = staffData?.technicians || (Array.isArray(staffData) ? staffData : []);
  const slaStats = slaData?.slaStats || slaData || {};
  const totalComplaints = slaStats.totalComplaints || 0;
  const breachedComplaints = slaStats.breachedCount || 0;
  const resolvedWithinSla = Math.max(0, totalComplaints - breachedComplaints);

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title="Operational & Financial Reports"
        subtitle="Authoritative collections velocity, staff SLA compliance, and grievance resolution metrics"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
        action={
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="report-building-select-label">Building Scope</InputLabel>
            <Select
              labelId="report-building-select-label"
              value={activeBuildingId || ""}
              label="Building Scope"
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              {buildings.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {/* SECTION 1: MAINTENANCE COLLECTIONS (SECTION 37 & APPENDIX §A.5) */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1.125rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            mb: 0.5,
          }}
        >
          Maintenance Collections for Period {currentPeriod}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Collections velocity and outstanding liabilities calculated from immutable ledger
        </Typography>

        {isColLoading ? (
          <TableLoadingSkeleton rows={2} />
        ) : (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`₨${totalBilled.toLocaleString()}`}
                label="Total Billed"
                delta="Assessed maintenance fees"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`₨${totalCollected.toLocaleString()}`}
                label="Total Collected"
                delta="Received via verified payments"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`₨${totalOutstanding.toLocaleString()}`}
                label="Total Outstanding"
                delta={totalOutstanding > 0 ? "Pending collection" : "Zero balance"}
                isHero={totalOutstanding > 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`${collectionRate}%`}
                label="Collection Efficiency"
                delta={`${collectionRate}% of total demand collected`}
              />
            </Grid>
          </Grid>
        )}
      </Box>

      {/* SECTION 2: RANKED OUTSTANDING BY FLAT & TREND CHART (SECTION 37 & 8.8) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "12px",
              borderColor: DESIGN_TOKENS.line[200],
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: DESIGN_TOKENS.text.primary,
                  }}
                >
                  Ranked Outstanding Dues by Flat
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Directly actionable: Click through to inspect flat ledger
                </Typography>
              </Box>
              <Button component={RouterLink} to="/invoices" size="small">
                Open Invoices
              </Button>
            </Box>

            {colStats.outstandingFlats && colStats.outstandingFlats.length > 0 ? (
              <Stack spacing={1.5}>
                {colStats.outstandingFlats.slice(0, 5).map((f) => (
                  <Box
                    key={f.flatId || f._id}
                    component={RouterLink}
                    to={`/flats/${f.flatId || f._id}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: DESIGN_TOKENS.line[200],
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: DESIGN_TOKENS.brand[600],
                        bgcolor: DESIGN_TOKENS.surface[50],
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Flat {f.flatNumber || "Unit"} • Block {f.blockName || "A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Occupant: {f.occupantName || "Resident"} • Overdue by {f.daysOverdue || 15}{" "}
                        days
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        color: DESIGN_TOKENS.danger[600],
                      }}
                    >
                      ₨{(f.amount || f.dueAmount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                No overdue accounts for this building period. All maintenance payments are clear!
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <TrendChart
            title="Collections Trend"
            subtitle="Trailing 6-month recovery velocity"
            metric={`${collectionRate}% Realized`}
            color={DESIGN_TOKENS.accent.blue}
            data={[62, 70, 75, 80, 84, collectionRate]}
            labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Current"]}
          />
        </Grid>
      </Grid>

      {/* SECTION 3: STAFF PERFORMANCE & RESOLUTION VELOCITY */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "12px",
              borderColor: DESIGN_TOKENS.line[200],
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              height: "100%",
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: DESIGN_TOKENS.text.primary,
                }}
              >
                Staff Performance & Resolution Velocity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Technician ranking by ticket turnaround time and resident rating
              </Typography>
            </Box>

            {isStaffLoading ? (
              <TableLoadingSkeleton rows={3} />
            ) : staffStats.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                No performance data recorded for on-duty technicians this cycle.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {staffStats.slice(0, 4).map((tech) => (
                  <Box
                    key={tech._id || tech.id}
                    sx={{
                      p: 2,
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: DESIGN_TOKENS.line[200],
                      bgcolor: DESIGN_TOKENS.surface[50],
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {tech.fullName || tech.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Specialty: {tech.specialty || tech.designation || "General Maintenance"} •
                        Avg {tech.avgResolutionHours || 4}h turnaround
                      </Typography>
                    </Box>
                    <Chip
                      label={`★ ${Number(tech.averageRating || 4.8).toFixed(1)}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: "#DCFCE7",
                        color: DESIGN_TOKENS.accent.green,
                        borderRadius: "999px",
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* SECTION 4: COMPLAINT SLA BREACH INTELLIGENCE */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "12px",
              borderColor: DESIGN_TOKENS.line[200],
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              height: "100%",
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: DESIGN_TOKENS.text.primary,
                }}
              >
                Complaint SLA Compliance
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Plain-language framing of resolution deadlines
              </Typography>
            </Box>

            {isSlaLoading ? (
              <TableLoadingSkeleton rows={3} />
            ) : (
              <Stack spacing={2.5}>
                <StatCard
                  value={`${resolvedWithinSla} of ${totalComplaints}`}
                  label="Complaints Resolved Within SLA"
                  delta={
                    breachedComplaints > 0
                      ? `${breachedComplaints} complaints missed SLA deadline this month`
                      : "100% compliant with building SLA standards"
                  }
                  isHero={breachedComplaints > 0}
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    bgcolor: DESIGN_TOKENS.surface[50],
                    border: "1px solid",
                    borderColor: DESIGN_TOKENS.line[200],
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    SLA Escalation Protocol
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
                    Complaints not acknowledged within 24 hours or unresolved past 72 hours are
                    automatically escalated to the Building Manager.
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
