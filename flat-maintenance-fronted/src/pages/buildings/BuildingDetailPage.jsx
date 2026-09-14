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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DomainIcon from "@mui/icons-material/Domain";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import { useParams, useNavigate } from "react-router-dom";
import { useBuildingDetail } from "../../features/buildings/hooks/use-buildings.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

export const BuildingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: building, isLoading } = useBuildingDetail(id);
  const { data: usersData } = useUsersList({ buildingId: id });
  const { data: auditData } = useAuditLogsList({ buildingId: id, limit: 5 });

  const assignedAdmins = (usersData?.users || (Array.isArray(usersData) ? usersData : [])).filter(
    (u) => u.role === "BUILDING_ADMIN" || u.role === "MANAGER"
  );
  const recentLogs = auditData?.logs || (Array.isArray(auditData) ? auditData : []);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={3} />
      </Box>
    );
  }

  const stats = building?.statistics || {};
  const totalFlats = stats.totalFlats || building?.totalFlats || 0;
  const occupiedFlats = stats.occupiedFlats || 0;
  const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 100;

  return (
    <Box>
      <PageHeader
        title={building?.name || "Building Complex"}
        subtitle={`Code: ${building?.code || "—"} • ID: ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: building?.name || "Details" },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/buildings")}
            sx={{
              borderColor: DESIGN_TOKENS.line[200],
              color: DESIGN_TOKENS.text.primary,
              fontWeight: 600,
            }}
          >
            Back to Buildings
          </Button>
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
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
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
              variant="h2"
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.375rem",
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
          <StatusChip status={building?.status || "ACTIVE"} />
        </Box>

        {/* Canonical StatCard Row per Master Spec */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={stats.totalBlocks ?? building?.totalBlocks ?? 1}
              label="Total Blocks / Towers"
              delta="Physical structures"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={totalFlats}
              label="Total Residential Flats"
              delta={`${occupiedFlats} occupied units`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              value={`${occupancyRate}%`}
              label="Occupancy Rate"
              delta="Active resident tenancies"
              isHero={true}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Stacked Tabs: Assigned Admins, Structure Summary, Recent Activity */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: "14px",
          borderColor: DESIGN_TOKENS.line[200],
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
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
            icon={<PersonOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Assigned Admins"
          />
          <Tab
            icon={<DomainIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Blocks & Flats Summary"
          />
          <Tab
            icon={<HistoryEduIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Recent Activity"
          />
        </Tabs>

        <Box sx={{ p: 3.5 }}>
          {/* Tab 0: Assigned Admins */}
          {activeTab === 0 && (
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
                          {admin.email} • Assigned Role: {admin.role}
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

          {/* Tab 1: Structure Summary */}
          {activeTab === 1 && (
            <Box>
              <Typography
                sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem", mb: 2 }}
              >
                Structural Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      bgcolor: DESIGN_TOKENS.surface[50],
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Blocks / Towers
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {stats.totalBlocks ?? 1}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      bgcolor: DESIGN_TOKENS.surface[50],
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Total Floors
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {stats.totalFloors ?? 4}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      bgcolor: DESIGN_TOKENS.surface[50],
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Total Units
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {totalFlats}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
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
    </Box>
  );
};

export default BuildingDetailPage;
