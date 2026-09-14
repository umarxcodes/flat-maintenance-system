// =====================  SOCIETY NOTICES & BULLETINS  =========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
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
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventNoteIcon from "@mui/icons-material/EventNote";
import BuildIcon from "@mui/icons-material/Build";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LinkIcon from "@mui/icons-material/Link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useNoticesList,
  usePublishNoticeMutation,
  useRetractNoticeMutation,
} from "../../features/notices/hooks/use-notices.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const NOTICE_CATEGORIES = [
  { value: "GENERAL", label: "General", color: "default" },
  { value: "MAINTENANCE", label: "Maintenance", color: "warning" },
  { value: "EMERGENCY", label: "Emergency", color: "error" },
  { value: "EVENT", label: "Community Event", color: "info" },
  { value: "FINANCIAL", label: "Financial / Dues", color: "success" },
  { value: "SECURITY", label: "Security Alert", color: "secondary" },
];

const NOTICE_PRIORITIES = [
  { value: "NORMAL", label: "Normal Priority", color: "default" },
  { value: "HIGH", label: "High Priority", color: "warning" },
  { value: "URGENT_EMERGENCY", label: "Urgent Emergency", color: "error" },
];

const TARGET_AUDIENCES = [
  { value: "ALL", label: "All Residents (Owners & Tenants)" },
  { value: "OWNERS_ONLY", label: "Property Owners Only" },
  { value: "TENANTS_ONLY", label: "Lease Tenants Only" },
];

// Zero-Trust schema matching backend createNoticeSchema exactly
const noticeFormSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title cannot exceed 160 characters"),
  content: z
    .string()
    .trim()
    .min(5, "Content must be at least 5 characters")
    .max(5000, "Content cannot exceed 5000 characters"),
  category: z.enum(["GENERAL", "MAINTENANCE", "EMERGENCY", "EVENT", "FINANCIAL", "SECURITY"]),
  priority: z.enum(["NORMAL", "HIGH", "URGENT_EMERGENCY"]),
  targetAudience: z.enum(["ALL", "OWNERS_ONLY", "TENANTS_ONLY"]),
  attachmentUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

export const NoticesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  // Modals state
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [readNotice, setReadNotice] = useState(null);
  const [retractNotice, setRetractNotice] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
  };

  const { data, isLoading, isError, error, refetch } = useNoticesList(queryParams);
  const publishMutation = usePublishNoticeMutation();
  const retractMutation = useRetractNoticeMutation();

  const notices = data?.notices || (Array.isArray(data) ? data : []);
  const totalCount = data?.meta?.totalRecords || data?.total || notices.length;

  // Filter client-side search query
  const filteredNotices = useMemo(() => {
    if (!searchQuery.trim()) return notices;
    const q = searchQuery.toLowerCase().trim();
    return notices.filter((n) => {
      const title = (n.title || "").toLowerCase();
      const content = (n.content || "").toLowerCase();
      const cat = (n.category || "").toLowerCase();
      return title.includes(q) || content.includes(q) || cat.includes(q);
    });
  }, [notices, searchQuery]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = notices.length;
    const urgent = notices.filter(
      (n) => n.priority === "URGENT_EMERGENCY" || n.priority === "HIGH"
    ).length;
    const maintenance = notices.filter((n) => n.category === "MAINTENANCE").length;
    const active = notices.filter((n) => {
      if (!n.expiresAt) return true;
      return new Date(n.expiresAt).getTime() > Date.now();
    }).length;
    return { total, urgent, maintenance, active };
  }, [notices]);

  // Form Management
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      buildingId: "",
      title: "",
      content: "",
      category: "GENERAL",
      priority: "NORMAL",
      targetAudience: "ALL",
      attachmentUrl: "",
      expiresAt: "",
    },
  });

  const onSubmitNotice = (values) => {
    // Sanitize payload strictly adhering to backend createNoticeSchema
    const payload = {
      buildingId: values.buildingId,
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      priority: values.priority,
      targetAudience: values.targetAudience,
    };

    if (values.attachmentUrl?.trim()) {
      payload.attachmentUrls = [values.attachmentUrl.trim()];
    }

    if (values.expiresAt?.trim()) {
      payload.expiresAt = new Date(values.expiresAt).toISOString();
    }

    publishMutation.mutate(payload, {
      onSuccess: () => {
        setIsPublishOpen(false);
        reset();
      },
    });
  };

  const handleRetractConfirm = () => {
    if (!retractNotice) return;
    const targetId = retractNotice.id || retractNotice._id;
    retractMutation.mutate(targetId, {
      onSuccess: () => {
        setRetractNotice(null);
        if (readNotice && (readNotice.id === targetId || readNotice._id === targetId)) {
          setReadNotice(null);
        }
      },
    });
  };

  const columns = [
    {
      id: "title",
      label: "Notice Title & Summary",
      render: (val, row) => (
        <Box
          sx={{ cursor: "pointer" }}
          onClick={() => setReadNotice(row)}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {val}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {row.content}
          </Typography>
        </Box>
      ),
    },
    {
      id: "category",
      label: "Category",
      render: (val) => {
        const item = NOTICE_CATEGORIES.find((c) => c.value === val);
        return (
          <Chip
            label={item?.label || val}
            size="small"
            color={item?.color || "default"}
            variant="soft"
            sx={{ fontWeight: 600, borderRadius: "6px" }}
          />
        );
      },
    },
    {
      id: "priority",
      label: "Priority",
      render: (val) => {
        const color = val === "URGENT_EMERGENCY" ? "error" : val === "HIGH" ? "warning" : "default";
        return (
          <Chip
            label={val === "URGENT_EMERGENCY" ? "URGENT" : val}
            color={color}
            size="small"
            variant="filled"
            sx={{ fontWeight: 700, borderRadius: "6px" }}
          />
        );
      },
    },
    {
      id: "targetAudience",
      label: "Audience",
      render: (val) => (
        <Chip
          label={val?.replace("_", " ") || "ALL"}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.7rem", fontWeight: 600 }}
        />
      ),
    },
    {
      id: "createdAt",
      label: "Broadcast Date",
      render: (val) =>
        val ? (
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            {new Date(val).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Typography>
        ) : (
          "—"
        ),
    },
    {
      id: "expiresAt",
      label: "Expiry",
      render: (val) => {
        if (!val) return <Typography variant="caption" color="text.secondary">No Expiry</Typography>;
        const isPast = new Date(val).getTime() < Date.now();
        return (
          <Typography
            variant="caption"
            sx={{
              color: isPast ? "text.secondary" : "text.primary",
              fontWeight: isPast ? 400 : 600,
            }}
          >
            {new Date(val).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
            {isPast && " (Expired)"}
          </Typography>
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Read Bulletin">
            <IconButton
              size="small"
              onClick={() => setReadNotice(row)}
              sx={{ color: "text.secondary" }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <PermissionGuard permission={PERMISSIONS.NOTICE_RETRACT}>
            <Tooltip title="Retract Notice">
              <IconButton
                size="small"
                color="error"
                onClick={() => setRetractNotice(row)}
                disabled={retractMutation.isPending}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Community Bulletins & Notices"
        subtitle="Broadcast community updates, emergency circulars, scheduled maintenance notices, and resident bulletins"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notices" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.NOTICE_CREATE}>
            <Button
              variant="contained"
              startIcon={<CampaignIcon />}
              onClick={() => {
                reset({
                  buildingId: "",
                  title: "",
                  content: "",
                  category: "GENERAL",
                  priority: "NORMAL",
                  targetAudience: "ALL",
                  attachmentUrl: "",
                  expiresAt: "",
                });
                setIsPublishOpen(true);
              }}
              sx={{ borderRadius: "10px" }}
            >
              Publish Notice
            </Button>
          </PermissionGuard>
        }
      />

      {/* KPI Stat Cards */}
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
                  Total Broadcasts
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
                <CampaignIcon />
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
                  Active Bulletins
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                  {kpiMetrics.active}
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
                <EventNoteIcon />
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
                  Urgent & High Priority
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>
                  {kpiMetrics.urgent}
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
                <WarningAmberIcon />
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
                  Maintenance Circulars
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>
                  {kpiMetrics.maintenance}
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

      {/* Filter and View Bar */}
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
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search notices, announcements, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280 }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {NOTICE_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Priorities</em>
                </MenuItem>
                {NOTICE_PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(categoryFilter || priorityFilter || searchQuery) && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setCategoryFilter("");
                  setPriorityFilter("");
                  setSearchQuery("");
                  setPage(0);
                }}
                sx={{ alignSelf: "center", color: "text.secondary" }}
              >
                Reset
              </Button>
            )}
          </Stack>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Main Content Area: 4 States */}
      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton variant="rounded" height={240} sx={{ borderRadius: "14px" }} />
            </Grid>
          ))}
        </Grid>
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
          {error?.message || "Failed to load community bulletins from the server."}
        </Alert>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          title="No Community Bulletins Found"
          description={
            categoryFilter || priorityFilter || searchQuery
              ? "No notices matched your active filter criteria."
              : "Publish your first society notice or emergency announcement to keep residents informed."
          }
          action={
            <Button
              variant="contained"
              startIcon={<CampaignIcon />}
              onClick={() => setIsPublishOpen(true)}
              sx={{ borderRadius: "10px" }}
            >
              Publish Notice
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <Box>
          <Grid container spacing={2.5}>
            {filteredNotices.map((notice) => {
              const isUrgent = notice.priority === "URGENT_EMERGENCY";
              const isHigh = notice.priority === "HIGH";
              const isPast = notice.expiresAt && new Date(notice.expiresAt).getTime() < Date.now();

              return (
                <Grid item xs={12} sm={6} md={4} key={notice._id || notice.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: isUrgent ? "error.main" : isHigh ? "warning.light" : "#E2E8F0",
                      background: "#FFFFFF",
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      opacity: isPast ? 0.75 : 1,
                      "&:hover": {
                        borderColor: isUrgent ? "error.dark" : "primary.main",
                        boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.08)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, pb: 1.5 }}>
                      {/* Top Badges */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Chip
                          label={notice.category}
                          size="small"
                          color={NOTICE_CATEGORIES.find((c) => c.value === notice.category)?.color || "default"}
                          variant="soft"
                          sx={{ fontWeight: 600, fontSize: "0.7rem", borderRadius: "6px" }}
                        />
                        <Chip
                          label={isUrgent ? "URGENT" : notice.priority}
                          size="small"
                          color={isUrgent ? "error" : isHigh ? "warning" : "default"}
                          variant="filled"
                          sx={{ fontWeight: 700, fontSize: "0.65rem", borderRadius: "6px" }}
                        />
                      </Stack>

                      {/* Notice Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: "#0B132B",
                          cursor: "pointer",
                          lineHeight: 1.3,
                          "&:hover": { color: "primary.main" },
                        }}
                        onClick={() => setReadNotice(notice)}
                      >
                        {notice.title}
                      </Typography>

                      {/* Content Excerpt */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          mb: 2,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                        }}
                      >
                        {notice.content}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Footer Details */}
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PeopleAltIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Audience: <b>{notice.targetAudience?.replace("_", " ") || "All Residents"}</b>
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTimeIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Broadcast:{" "}
                            {new Date(notice.createdAt).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>

                    {/* Card Actions */}
                    <Box
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: "#F8FAFC",
                        borderTop: "1px solid #F1F5F9",
                        borderBottomLeftRadius: "14px",
                        borderBottomRightRadius: "14px",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => setReadNotice(notice)}
                          startIcon={<VisibilityIcon fontSize="small" />}
                          sx={{ fontWeight: 600 }}
                        >
                          Read Bulletin
                        </Button>

                        <PermissionGuard permission={PERMISSIONS.NOTICE_RETRACT}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setRetractNotice(notice)}
                            disabled={retractMutation.isPending}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </PermissionGuard>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Simple Pagination Footer for Cards */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <DataTable
              columns={[]}
              rows={[]}
              isLoading={false}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(r) => {
                setRowsPerPage(r);
                setPage(0);
              }}
            />
          </Box>
        </Box>
      ) : (
        /* Data Table View */
        <DataTable
          columns={columns}
          rows={filteredNotices}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
        />
      )}

      {/* Publish Notice Modal */}
      <Dialog open={isPublishOpen} onClose={() => setIsPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 1 }}>
          Broadcast Official Notice
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitNotice)} noValidate>
          <DialogContent dividers sx={{ p: 3 }}>
            {publishMutation.isError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
                {publishMutation.error?.response?.data?.message ||
                  publishMutation.error?.message ||
                  "Failed to broadcast notice."}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                <InputLabel>Target Building Complex</InputLabel>
                <Select label="Target Building Complex" defaultValue="" {...register("buildingId")}>
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </Select>
                {errors.buildingId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.buildingId.message}
                  </Typography>
                )}
              </FormControl>

              <TextField
                label="Bulletin Headline / Title"
                placeholder="e.g. Scheduled Water Pipeline Maintenance"
                fullWidth
                size="small"
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select label="Category" defaultValue="GENERAL" {...register("category")}>
                      {NOTICE_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select label="Priority" defaultValue="NORMAL" {...register("priority")}>
                      {NOTICE_PRIORITIES.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Audience</InputLabel>
                    <Select label="Target Audience" defaultValue="ALL" {...register("targetAudience")}>
                      {TARGET_AUDIENCES.map((a) => (
                        <MenuItem key={a.value} value={a.value}>
                          {a.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                label="Notice Announcement Body"
                placeholder="Type the full announcement details for residents..."
                multiline
                rows={5}
                fullWidth
                error={Boolean(errors.content)}
                helperText={errors.content?.message}
                {...register("content")}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Optional Attachment URL"
                    placeholder="https://example.com/circular.pdf"
                    fullWidth
                    size="small"
                    error={Boolean(errors.attachmentUrl)}
                    helperText={errors.attachmentUrl?.message}
                    {...register("attachmentUrl")}
                  />
                </Grid>

                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Expiry Date (Optional)"
                    type="date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register("expiresAt")}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPublishOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={publishMutation.isPending}
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            >
              {publishMutation.isPending ? "Broadcasting..." : "Broadcast Notice"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Read Notice Modal */}
      <Dialog open={Boolean(readNotice)} onClose={() => setReadNotice(null)} maxWidth="sm" fullWidth>
        {readNotice && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={readNotice.category}
                  size="small"
                  color={NOTICE_CATEGORIES.find((c) => c.value === readNotice.category)?.color || "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={readNotice.priority}
                  size="small"
                  color={
                    readNotice.priority === "URGENT_EMERGENCY"
                      ? "error"
                      : readNotice.priority === "HIGH"
                      ? "warning"
                      : "default"
                  }
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 1.5, color: "#0B132B" }}>
                {readNotice.title}
              </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
              {/* Notice Metadata Banner */}
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Target Audience:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {readNotice.targetAudience?.replace("_", " ") || "All Residents"}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Broadcast Date:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(readNotice.createdAt).toLocaleString("en-PK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Typography>
                  </Grid>

                  {readNotice.expiresAt && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Expiry Date:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(readNotice.expiresAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Notice Body */}
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                  color: "#334155",
                  fontSize: "0.95rem",
                }}
              >
                {readNotice.content}
              </Typography>

              {/* Attachments if any */}
              {readNotice.attachmentUrls && readNotice.attachmentUrls.length > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #F1F5F9" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    ATTACHMENTS:
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {readNotice.attachmentUrls.map((url, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        size="small"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        startIcon={<LinkIcon />}
                        sx={{ justifyContent: "flex-start", textTransform: "none" }}
                      >
                        Attachment Link #{idx + 1}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setReadNotice(null)} color="inherit">
                Close
              </Button>
              <PermissionGuard permission={PERMISSIONS.NOTICE_RETRACT}>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    setRetractNotice(readNotice);
                  }}
                  startIcon={<DeleteOutlineIcon />}
                >
                  Retract Notice
                </Button>
              </PermissionGuard>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Retract Notice Confirmation */}
      <ConfirmDialog
        open={Boolean(retractNotice)}
        title="Retract Community Notice"
        description={`Are you sure you want to retract notice "${retractNotice?.title}"? It will immediately be archived and removed from active resident bulletins.`}
        confirmLabel="Retract Notice"
        confirmColor="error"
        isLoading={retractMutation.isPending}
        onConfirm={handleRetractConfirm}
        onCancel={() => setRetractNotice(null)}
      />
    </Box>
  );
};

export default NoticesListPage;

