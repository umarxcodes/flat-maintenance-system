// =====================  AUDIT LOGS & EVENT TRAIL  ============
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Skeleton from "@mui/material/Skeleton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Material Icons
import SecurityIcon from "@mui/icons-material/Security";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BuildIcon from "@mui/icons-material/Build";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HistoryIcon from "@mui/icons-material/History";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import RouterIcon from "@mui/icons-material/Router";

import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  AUDIT_CATEGORIES,
  getActionCategory,
} from "../../features/audit-logs/constants/audit-logs.constants.js";

// Design System Tokens
const DESIGN_TOKENS = {
  brand: { 50: "#EEF2FF", 100: "#E0E7FF", 600: "#4F46E5", 700: "#4338CA" },
  navy: "#0B132B",
  slate: { 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 600: "#475569", 700: "#334155" },
  emerald: { 50: "#ECFDF5", 500: "#10B981", 600: "#059669" },
  amber: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706" },
  purple: { 50: "#F5F3FF", 500: "#8B5CF6", 600: "#7C3AED" },
};

/**
 * Helper to compute diff between beforeState and afterState
 */
const computeStateDiff = (before, after) => {
  if (!before && !after) return [];
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const allKeys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));

  return allKeys.map((key) => {
    const valB = b[key];
    const valA = a[key];
    const strB = JSON.stringify(valB);
    const strA = JSON.stringify(valA);

    let changeType = "unchanged";
    if (valB === undefined && valA !== undefined) {
      changeType = "added";
    } else if (valB !== undefined && valA === undefined) {
      changeType = "removed";
    } else if (strB !== strA) {
      changeType = "modified";
    }

    return {
      key,
      before: valB,
      after: valA,
      changeType,
    };
  });
};

export const AuditLogsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [buildingFilter, setBuildingFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectorTab, setInspectorTab] = useState(0);
  const [copyNotification, setCopyNotification] = useState("");

  // Buildings and Users metadata
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: usersData } = useUsersList();
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);

  // Fast user ID lookup map
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const id = (u._id || u.id || "").toString();
      if (id) {
        map.set(id, {
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "System User",
          email: u.email || "",
          role: u.role || "",
        });
      }
    });
    return map;
  }, [users]);

  // Query Params with Zero-Trust Sanitization
  const queryParams = useMemo(() => {
    const p = {
      page: page + 1,
      limit: rowsPerPage,
    };
    if (buildingFilter) p.buildingId = buildingFilter;
    if (actionFilter) p.action = actionFilter;
    if (resourceFilter) p.resourceType = resourceFilter;
    if (fromDateFilter) p.from = fromDateFilter;
    if (toDateFilter) p.to = toDateFilter;
    return p;
  }, [page, rowsPerPage, buildingFilter, actionFilter, resourceFilter, fromDateFilter, toDateFilter]);

  const { data, isLoading, isError, error, refetch } = useAuditLogsList(queryParams);

  const logs = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.auditLogs && Array.isArray(data.auditLogs)) return data.auditLogs;
    if (data?.logs && Array.isArray(data.logs)) return data.logs;
    return [];
  }, [data]);

  const totalCount = data?.meta?.totalRecords || data?.total || logs.length;

  // Filter client-side search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const action = (log.action || "").toLowerCase();
      const resType = (log.resourceType || "").toLowerCase();
      const resId = (log.resourceId || "").toString().toLowerCase();
      const actorId = (log.actorUserId || "").toString().toLowerCase();
      const role = (log.actorRole || "").toLowerCase();
      const ip = (log.ipAddress || "").toLowerCase();
      const correlation = (log.correlationId || "").toLowerCase();
      const userMeta = userMap.get(actorId);
      const userName = (userMeta?.name || "").toLowerCase();
      const userEmail = (userMeta?.email || "").toLowerCase();

      return (
        action.includes(q) ||
        resType.includes(q) ||
        resId.includes(q) ||
        actorId.includes(q) ||
        role.includes(q) ||
        ip.includes(q) ||
        correlation.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q)
      );
    });
  }, [logs, searchQuery, userMap]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = totalCount || logs.length;
    let financialOps = 0;
    let securityOps = 0;
    let maintenanceOps = 0;

    logs.forEach((log) => {
      const category = getActionCategory(log.action);
      if (category.label === AUDIT_CATEGORIES.FINANCIAL.label) {
        financialOps++;
      } else if (category.label === AUDIT_CATEGORIES.SECURITY.label) {
        securityOps++;
      } else {
        maintenanceOps++;
      }
    });

    return { total, financialOps, securityOps, maintenanceOps };
  }, [logs, totalCount]);

  // Format Helper: Relative Date
  const formatDateTime = (val) => {
    if (!val) return "-";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopyNotification(`Copied ${label} to clipboard!`);
  };

  // Export visible records to JSON file
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `audit_compliance_trail_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetFilters = () => {
    setBuildingFilter("");
    setActionFilter("");
    setResourceFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setSearchQuery("");
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    buildingFilter ||
      actionFilter ||
      resourceFilter ||
      fromDateFilter ||
      toDateFilter ||
      searchQuery
  );

  // Table Columns
  const columns = [
    {
      id: "createdAt",
      label: "Timestamp",
      minWidth: 175,
      render: (val) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.navy, fontSize: "0.8125rem" }}>
            {formatDateTime(val)}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.7rem" }}>
            {val ? new Date(val).toISOString() : "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "action",
      label: "Audit Mutation",
      minWidth: 190,
      render: (val) => {
        const cat = getActionCategory(val);
        return (
          <Tooltip title={`Category: ${cat.label}`}>
            <Chip
              label={val ? val.replace(/_/g, " ") : "UNKNOWN"}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.72rem",
                bgcolor: cat.bgColor,
                color: cat.color,
                border: `1px solid ${cat.borderColor}`,
                borderRadius: "6px",
                letterSpacing: "0.02em",
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      id: "resourceType",
      label: "Target Resource",
      minWidth: 160,
      render: (val, row) => (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Chip
            label={val || "DOMAIN"}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              borderRadius: "4px",
              borderColor: DESIGN_TOKENS.slate[200],
              bgcolor: DESIGN_TOKENS.slate[50],
            }}
          />
          {row.resourceId && (
            <Tooltip title={`Resource ID: ${row.resourceId}`}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  color: "text.secondary",
                  bgcolor: "#F1F5F9",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
                onClick={() => handleCopy(String(row.resourceId), "Resource ID")}
              >
                #{String(row.resourceId).slice(-6)}
              </Typography>
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      id: "actorUserId",
      label: "Actor & Role",
      minWidth: 190,
      render: (val, row) => {
        const actorId = (val || "").toString();
        const userMeta = userMap.get(actorId);
        return (
          <Stack spacing={0.25}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip
                label={row.actorRole || "SYSTEM"}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor: row.actorRole === "SUPER_ADMIN" ? "#FEE2E2" : "#E0E7FF",
                  color: row.actorRole === "SUPER_ADMIN" ? "#DC2626" : DESIGN_TOKENS.brand[600],
                  borderRadius: "4px",
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: DESIGN_TOKENS.navy }}>
                {userMeta ? userMeta.name : (actorId ? `User #${actorId.slice(-6)}` : "System Daemon")}
              </Typography>
            </Stack>
            {userMeta?.email && (
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                {userMeta.email}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      id: "ipAddress",
      label: "Context & IP",
      minWidth: 140,
      render: (val, row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "text.primary" }}>
            {val || "127.0.0.1"}
          </Typography>
          {row.correlationId && (
            <Tooltip title={`Correlation ID: ${row.correlationId}`}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  color: "text.secondary",
                  fontSize: "0.68rem",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                cid: {String(row.correlationId).slice(0, 8)}...
              </Typography>
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      id: "actions",
      label: "Forensic State",
      align: "right",
      minWidth: 120,
      render: (_, row) => (
        <Tooltip title="Inspect State Diff & Forensics">
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={() => {
              setSelectedLog(row);
              setInspectorTab(0);
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "8px",
              borderColor: DESIGN_TOKENS.slate[200],
              color: DESIGN_TOKENS.brand[600],
              bgcolor: DESIGN_TOKENS.brand[50],
              "&:hover": {
                bgcolor: DESIGN_TOKENS.brand[100],
                borderColor: DESIGN_TOKENS.brand[600],
              },
            }}
          >
            Inspect
          </Button>
        </Tooltip>
      ),
    },
  ];

  const stateDiff = useMemo(() => {
    if (!selectedLog) return [];
    return computeStateDiff(selectedLog.beforeState, selectedLog.afterState);
  }, [selectedLog]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header with Compliance Branding & Quick Actions */}
      <PageHeader
        title="Audit Logs & Compliance Trail"
        subtitle="Immutable append-only chronological log of security events, administrative actions, and state transitions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Compliance" }, { label: "Audit Logs" }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Refresh Latest Audit Events">
              <IconButton
                onClick={() => refetch()}
                sx={{
                  border: `1px solid ${DESIGN_TOKENS.slate[200]}`,
                  borderRadius: "10px",
                  bgcolor: "#FFFFFF",
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                borderColor: DESIGN_TOKENS.slate[200],
                color: DESIGN_TOKENS.navy,
                bgcolor: "#FFFFFF",
                "&:hover": { bgcolor: DESIGN_TOKENS.slate[50], borderColor: DESIGN_TOKENS.slate[600] },
              }}
            >
              Export JSON
            </Button>
          </Stack>
        }
      />

      {/* KPI Stat Cards (100% Full-Width Responsive CSS Grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          width: "100%",
          mb: 3,
        }}
      >
        <StatCard
          value={isLoading ? "..." : kpiMetrics.total.toLocaleString()}
          label="Total Audit Records"
          delta="Immutable append-only ledger"
          icon={<SecurityIcon />}
          iconBg="#EEF2FF"
          iconColor={DESIGN_TOKENS.brand[600]}
        />
        <StatCard
          value={isLoading ? "..." : kpiMetrics.financialOps.toLocaleString()}
          label="Financial Operations"
          delta="Invoices, payments & expenses"
          icon={<AccountBalanceIcon />}
          iconBg="#ECFDF5"
          iconColor="#059669"
        />
        <StatCard
          value={isLoading ? "..." : kpiMetrics.securityOps.toLocaleString()}
          label="Security & Access"
          delta="Role shifts, invites & gates"
          icon={<VpnKeyIcon />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
        />
        <StatCard
          value={isLoading ? "..." : kpiMetrics.maintenanceOps.toLocaleString()}
          label="Operational Activity"
          delta="Work orders, tickets & docs"
          icon={<BuildIcon />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
      </Box>

      {/* Filter Bar with Building, Action, Domain, Date Range & Search */}
      <FilterBar onReset={handleResetFilters} hasActiveFilters={hasActiveFilters}>
        <TextField
          size="small"
          placeholder="Search by action, ID, actor, or IP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260, bgcolor: "#FFFFFF" }}
        />

        {/* Building Filter */}
        <FormControl size="small" sx={{ minWidth: 180, bgcolor: "#FFFFFF" }}>
          <InputLabel>Building Complex</InputLabel>
          <Select
            value={buildingFilter}
            label="Building Complex"
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Buildings</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b._id || b.id} value={b._id || b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Taxonomy Filter */}
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: "#FFFFFF" }}>
          <InputLabel>Mutation Action</InputLabel>
          <Select
            value={actionFilter}
            label="Mutation Action"
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Mutation Actions</em>
            </MenuItem>
            {Object.values(AUDIT_ACTIONS).map((action) => (
              <MenuItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Resource Domain Filter */}
        <FormControl size="small" sx={{ minWidth: 170, bgcolor: "#FFFFFF" }}>
          <InputLabel>Resource Domain</InputLabel>
          <Select
            value={resourceFilter}
            label="Resource Domain"
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Domains</em>
            </MenuItem>
            {Object.values(AUDIT_RESOURCE_TYPES).map((res) => (
              <MenuItem key={res} value={res}>
                {res}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* From Date */}
        <TextField
          size="small"
          type="date"
          label="From Date"
          value={fromDateFilter}
          onChange={(e) => {
            setFromDateFilter(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150, bgcolor: "#FFFFFF" }}
        />

        {/* To Date */}
        <TextField
          size="small"
          type="date"
          label="To Date"
          value={toDateFilter}
          onChange={(e) => {
            setToDateFilter(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150, bgcolor: "#FFFFFF" }}
        />
      </FilterBar>

      {/* Error Alert with Retry CTA */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "12px" }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || "Failed to retrieve audit log trail from the server."}
        </Alert>
      )}

      {/* Data Table with Zero Parity Gaps */}
      <DataTable
        columns={columns}
        rows={filteredLogs}
        isLoading={isLoading}
        emptyTitle="No audit records found"
        emptyDescription="There are no audit events matching the configured filters. Try broadening your date or domain parameters."
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
      />

      {/* Forensic State Inspector Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 2, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: DESIGN_TOKENS.brand[50],
                  color: DESIGN_TOKENS.brand[600],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FingerprintIcon fontSize="medium" />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 700, color: DESIGN_TOKENS.navy }}>
                    Audit Event: {selectedLog?.action?.replace(/_/g, " ")}
                  </Typography>
                  <Chip
                    label={selectedLog?.resourceType}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      borderRadius: "6px",
                      bgcolor: DESIGN_TOKENS.slate[100],
                      fontSize: "0.72rem",
                    }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Event ID: {selectedLog?._id || selectedLog?.id} • Timestamp: {formatDateTime(selectedLog?.createdAt)}
                </Typography>
              </Box>
            </Stack>

            <Tooltip title="Copy Complete Event JSON">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), "Audit Event JSON")}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  borderColor: DESIGN_TOKENS.slate[200],
                  color: DESIGN_TOKENS.navy,
                }}
              >
                Copy JSON
              </Button>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          {/* Metadata Card Strip */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: "12px",
              bgcolor: DESIGN_TOKENS.slate[50],
              borderColor: DESIGN_TOKENS.slate[200],
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Actor Identity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.navy }}>
                  {userMap.get((selectedLog?.actorUserId || "").toString())?.name ||
                    (selectedLog?.actorUserId ? `User #${String(selectedLog?.actorUserId).slice(-6)}` : "System / Daemon")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Role: {selectedLog?.actorRole || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Target Entity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.navy }}>
                  {selectedLog?.resourceType}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                  ID: {selectedLog?.resourceId}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Client IP Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", color: DESIGN_TOKENS.navy }}>
                  {selectedLog?.ipAddress || "127.0.0.1"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Building: {selectedLog?.buildingId || "Global / Unassigned"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Correlation Trace
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: DESIGN_TOKENS.navy,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedLog?.correlationId || "None recorded"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Agent: {selectedLog?.userAgent ? String(selectedLog.userAgent).slice(0, 25) + "..." : "Express API"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Diff & Snapshot Tabs */}
          <Tabs
            value={inspectorTab}
            onChange={(_, v) => setInspectorTab(v)}
            sx={{
              mb: 2.5,
              borderBottom: `1px solid ${DESIGN_TOKENS.slate[200]}`,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
            }}
          >
            <Tab icon={<CompareArrowsIcon fontSize="small" />} iconPosition="start" label="Computed State Diff" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Before Snapshot" />
            <Tab icon={<CheckCircleOutlinedIcon fontSize="small" />} iconPosition="start" label="After Snapshot" />
          </Tabs>

          {/* Tab 0: Visual Diff Analysis */}
          {inspectorTab === 0 && (
            <Box>
              {stateDiff.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: "10px" }}>
                  No state mutation snapshots recorded for this event (initial read or system trigger).
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.navy }}>
                    Attribute Transition Analysis ({stateDiff.filter((d) => d.changeType !== "unchanged").length} mutations detected)
                  </Typography>

                  <TableContainerWrapper>
                    <Box sx={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                        <thead>
                          <tr style={{ background: DESIGN_TOKENS.slate[50], borderBottom: `2px solid ${DESIGN_TOKENS.slate[200]}` }}>
                            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700 }}>Attribute Key</th>
                            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700 }}>Mutation Type</th>
                            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700 }}>Before State</th>
                            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700 }}>After State</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stateDiff.map((diff) => {
                            let chipColor = "default";
                            let chipBg = DESIGN_TOKENS.slate[100];
                            if (diff.changeType === "added") {
                              chipColor = DESIGN_TOKENS.emerald[600];
                              chipBg = DESIGN_TOKENS.emerald[50];
                            } else if (diff.changeType === "modified") {
                              chipColor = DESIGN_TOKENS.brand[600];
                              chipBg = DESIGN_TOKENS.brand[50];
                            } else if (diff.changeType === "removed") {
                              chipColor = "#DC2626";
                              chipBg = "#FEE2E2";
                            }

                            return (
                              <tr
                                key={diff.key}
                                style={{
                                  borderBottom: `1px solid ${DESIGN_TOKENS.slate[200]}`,
                                  background: diff.changeType !== "unchanged" ? chipBg : "transparent",
                                }}
                              >
                                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700 }}>
                                  {diff.key}
                                </td>
                                <td style={{ padding: "10px 14px" }}>
                                  <Chip
                                    label={diff.changeType.toUpperCase()}
                                    size="small"
                                    sx={{
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      height: 20,
                                      bgcolor: chipBg,
                                      color: chipColor,
                                      borderRadius: "4px",
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.75rem", color: "#64748B" }}>
                                  {diff.before !== undefined ? JSON.stringify(diff.before) : "—"}
                                </td>
                                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600, color: DESIGN_TOKENS.navy }}>
                                  {diff.after !== undefined ? JSON.stringify(diff.after) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Box>
                  </TableContainerWrapper>
                </Stack>
              )}
            </Box>
          )}

          {/* Tab 1: Before State Snapshot */}
          {inspectorTab === 1 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                bgcolor: "#0F172A",
                color: "#E2E8F0",
                borderRadius: "12px",
                maxHeight: 380,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              <pre style={{ margin: 0 }}>
                {selectedLog?.beforeState
                  ? JSON.stringify(selectedLog.beforeState, null, 2)
                  : "// Pre-state null (New Entity Creation)"}
              </pre>
            </Paper>
          )}

          {/* Tab 2: After State Snapshot */}
          {inspectorTab === 2 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                bgcolor: "#0F172A",
                color: "#E2E8F0",
                borderRadius: "12px",
                maxHeight: 380,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              <pre style={{ margin: 0 }}>
                {selectedLog?.afterState
                  ? JSON.stringify(selectedLog.afterState, null, 2)
                  : "// Post-state null (Entity Purged / Destroyed)"}
              </pre>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelectedLog(null)}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Feedback Notification */}
      <Snackbar
        open={Boolean(copyNotification)}
        autoHideDuration={2500}
        onClose={() => setCopyNotification("")}
        message={copyNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

const TableContainerWrapper = ({ children }) => (
  <Box
    sx={{
      border: `1px solid ${DESIGN_TOKENS.slate[200]}`,
      borderRadius: "12px",
      overflow: "hidden",
    }}
  >
    {children}
  </Box>
);

export default AuditLogsListPage;
