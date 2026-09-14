// =====================  NOTIFICATIONS LIST PAGE  =============
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import BuildIcon from "@mui/icons-material/Build";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SecurityIcon from "@mui/icons-material/Security";
import CampaignIcon from "@mui/icons-material/Campaign";
import ShieldIcon from "@mui/icons-material/Shield";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  useNotificationsList,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../features/notifications/hooks/use-notifications.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";

const NOTIFICATION_CATEGORIES = [
  { value: "INVOICE", label: "Invoices", icon: ReceiptLongIcon, color: "info" },
  { value: "PAYMENT", label: "Payments", icon: PaidIcon, color: "success" },
  { value: "WORK_ORDER", label: "Work Orders", icon: BuildIcon, color: "warning" },
  { value: "COMPLAINT", label: "Complaints", icon: ReportProblemIcon, color: "error" },
  { value: "VISITOR", label: "Gate & Visitors", icon: SecurityIcon, color: "secondary" },
  { value: "NOTICE", label: "Notices", icon: CampaignIcon, color: "primary" },
  { value: "SECURITY", label: "Security Alerts", icon: ShieldIcon, color: "error" },
];

export const NotificationsListPage = () => {
  const [readFilter, setReadFilter] = useState("all"); // 'all' | 'unread' | 'read'
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectItem, setInspectItem] = useState(null);

  const queryParams = useMemo(() => {
    const params = { limit: 50 };
    if (readFilter === "unread") params.isRead = false;
    if (readFilter === "read") params.isRead = true;
    if (categoryFilter) params.category = categoryFilter;
    return params;
  }, [readFilter, categoryFilter]);

  const { data, isLoading, isError, error, refetch } = useNotificationsList(queryParams);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications || (Array.isArray(data) ? data : []);

  // Filter client-side search query
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase().trim();
    return notifications.filter((n) => {
      const title = (n.title || "").toLowerCase();
      const body = (n.body || n.message || "").toLowerCase();
      const cat = (n.category || "").toLowerCase();
      return title.includes(q) || body.includes(q) || cat.includes(q);
    });
  }, [notifications, searchQuery]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const financial = notifications.filter(
      (n) => n.category === "INVOICE" || n.category === "PAYMENT"
    ).length;
    const operations = notifications.filter(
      (n) => n.category === "WORK_ORDER" || n.category === "COMPLAINT"
    ).length;
    return { total, unread, financial, operations };
  }, [notifications]);

  const getCategoryConfig = (category) => {
    return (
      NOTIFICATION_CATEGORIES.find((c) => c.value === category) || {
        label: category || "General",
        icon: NotificationsIcon,
        color: "primary",
      }
    );
  };

  const handleMarkRead = (item, e) => {
    e?.stopPropagation();
    markReadMutation.mutate(item.id || item._id, {
      onSuccess: () => {
        if (inspectItem && (inspectItem.id === item.id || inspectItem._id === item._id)) {
          setInspectItem((prev) => ({ ...prev, isRead: true }));
        }
      },
    });
  };

  const handleOpenInspect = (item) => {
    setInspectItem(item);
    if (!item.isRead) {
      markReadMutation.mutate(item.id || item._id);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="In-App Notifications & Alerts"
        subtitle={`Real-time operational alerts, gate arrivals, payment verifications, and society notices (${kpiMetrics.unread} unread)`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
        action={
          kpiMetrics.unread > 0 && (
            <Button
              variant="contained"
              startIcon={<DoneAllIcon />}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              sx={{ borderRadius: "10px", fontWeight: 700 }}
            >
              {markAllMutation.isPending ? "Marking..." : "Mark All Read"}
            </Button>
          )
        }
      />

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Notifications
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "#0B132B" }}>
                  {kpiMetrics.total}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <NotificationsIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Unread Alerts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>
                  {kpiMetrics.unread}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "error.lighter",
                  color: "error.main",
                }}
              >
                <MarkEmailUnreadIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Financial Alerts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                  {kpiMetrics.financial}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "success.lighter",
                  color: "success.main",
                }}
              >
                <PaidIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Maintenance & Ops
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>
                  {kpiMetrics.operations}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "warning.lighter",
                  color: "warning.main",
                }}
              >
                <BuildIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search notifications by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Read Status</InputLabel>
              <Select
                value={readFilter}
                label="Read Status"
                onChange={(e) => setReadFilter(e.target.value)}
              >
                <MenuItem value="all">All Notifications</MenuItem>
                <MenuItem value="unread">Unread Only</MenuItem>
                <MenuItem value="read">Read Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {NOTIFICATION_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(readFilter !== "all" || categoryFilter || searchQuery) && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setReadFilter("all");
                  setCategoryFilter("");
                  setSearchQuery("");
                }}
                sx={{ alignSelf: "center", color: "text.secondary" }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Main Notification Stream: 4 States */}
      {isLoading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4, 5].map((idx) => (
            <Skeleton
              key={idx}
              variant="rounded"
              height={86}
              sx={{ borderRadius: "14px" }}
            />
          ))}
        </Stack>
      ) : isError ? (
        <Alert
          severity="error"
          sx={{ borderRadius: "12px", mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || "Failed to load notifications from server."}
        </Alert>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<NotificationsIcon sx={{ fontSize: 48, color: "text.disabled" }} />}
          title={readFilter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
          description={
            searchQuery || categoryFilter
              ? "No alerts matched your current search and filter settings."
              : "You currently have no new notifications or alerts in your feed."
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {filteredNotifications.map((item) => {
            const isUnread = !item.isRead;
            const categoryConfig = getCategoryConfig(item.category);
            const CategoryIcon = categoryConfig.icon;

            return (
              <Paper
                key={item.id || item._id}
                elevation={0}
                onClick={() => handleOpenInspect(item)}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  bgcolor: isUnread ? "rgba(79, 70, 229, 0.03)" : "#FFFFFF",
                  border: "1.5px solid",
                  borderColor: isUnread ? "primary.main" : "#E2E8F0",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2.5,
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 15px -2px rgba(0, 0, 0, 0.06)",
                    transform: "translateX(2px)",
                  },
                }}
              >
                {/* Left: Icon & Content */}
                <Stack direction="row" spacing={2.5} alignItems="center" flex={1}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isUnread ? "primary.lighter" : "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isUnread ? "primary.main" : "text.secondary",
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon fontSize="small" />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.4 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: isUnread ? 800 : 600,
                          color: isUnread ? "#0B132B" : "text.primary",
                          fontSize: "0.95rem",
                        }}
                      >
                        {item.title}
                      </Typography>

                      {isUnread && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <Chip
                        label={categoryConfig.label}
                        size="small"
                        color={categoryConfig.color}
                        variant="soft"
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, borderRadius: "5px" }}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.body || item.message}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                      <AccessTimeIcon sx={{ fontSize: "0.75rem", color: "text.disabled" }} />
                      <Typography variant="caption" color="text.disabled">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("en-PK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                {/* Right: Quick Action */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="View Alert Details">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInspect(item);
                      }}
                      sx={{ color: "text.secondary" }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {isUnread && (
                    <Tooltip title="Mark as Read">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => handleMarkRead(item, e)}
                        disabled={markReadMutation.isPending}
                      >
                        <CheckCircleOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Inspect Notification Modal */}
      <Dialog
        open={Boolean(inspectItem)}
        onClose={() => setInspectItem(null)}
        maxWidth="sm"
        fullWidth
      >
        {inspectItem && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={inspectItem.category || "NOTIFICATION"}
                  size="small"
                  color={getCategoryConfig(inspectItem.category).color}
                  sx={{ fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {inspectItem.createdAt
                    ? new Date(inspectItem.createdAt).toLocaleString("en-PK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1.5, color: "#0B132B" }}>
                {inspectItem.title}
              </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                  color: "#334155",
                  fontSize: "0.95rem",
                }}
              >
                {inspectItem.body || inspectItem.message}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setInspectItem(null)} color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NotificationsListPage;

