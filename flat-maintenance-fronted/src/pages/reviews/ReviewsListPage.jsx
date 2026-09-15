// =====================  REVIEWS & SERVICE RATINGS  ===========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
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
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FlagIcon from "@mui/icons-material/Flag";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarIcon from "@mui/icons-material/Star";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useReviewsList,
  useCreateReviewMutation,
  useModerateReviewMutation,
} from "../../features/reviews/hooks/use-reviews.js";
import { useMaintenanceRequestsList } from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useStaffList } from "../../features/staff/hooks/use-staff.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

const reviewSchema = z.object({
  maintenanceRequestId: z.string().min(1, "Completed work order is required"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1 star").max(5),
  title: z.string().trim().max(100).optional(),
  comment: z.string().trim().max(1000).optional(),
});

export const ReviewsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [moderationFilter, setModerationFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [moderateDialogReview, setModerateDialogReview] = useState(null);
  const [targetModerationStatus, setTargetModerationStatus] = useState("APPROVED");
  const [moderationReason, setModerationReason] = useState("");

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(moderationFilter && { moderationStatus: moderationFilter }),
    ...(staffFilter && { staffId: staffFilter }),
  };

  const { data, isLoading } = useReviewsList(queryParams);
  const createReviewMutation = useCreateReviewMutation();
  const moderateMutation = useModerateReviewMutation();

  const { data: requestsData } = useMaintenanceRequestsList({ limit: 50 });
  const maintenanceRequests = requestsData?.requests || (Array.isArray(requestsData) ? requestsData : []);

  const { data: staffData } = useStaffList({ limit: 100 });
  const staffList = staffData?.staff || (Array.isArray(staffData) ? staffData : []);

  const rawReviews = data?.reviews || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawReviews.length;

  const filteredReviews = useMemo(() => {
    if (!search) return rawReviews;
    const q = search.toLowerCase();
    return rawReviews.filter((r) => {
      const comment = (r.comment || "").toLowerCase();
      const title = (r.title || "").toLowerCase();
      const staffName = `${r.staff?.user?.firstName || ""} ${r.staff?.user?.lastName || ""}`.toLowerCase();
      const reviewerName = `${r.reviewer?.firstName || ""} ${r.reviewer?.lastName || ""}`.toLowerCase();
      return comment.includes(q) || title.includes(q) || staffName.includes(q) || reviewerName.includes(q);
    });
  }, [rawReviews, search]);

  // Metrics
  const averageRating = useMemo(() => {
    if (rawReviews.length === 0) return "5.0";
    const total = rawReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    return (total / rawReviews.length).toFixed(1);
  }, [rawReviews]);

  const fiveStarCount = useMemo(() => rawReviews.filter((r) => r.rating === 5).length, [rawReviews]);
  const flaggedCount = useMemo(() => rawReviews.filter((r) => r.moderationStatus === "FLAGGED").length, [rawReviews]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      maintenanceRequestId: "",
      rating: 5,
      title: "",
      comment: "",
    },
  });

  const handleOpenSubmit = () => {
    reset({
      maintenanceRequestId: maintenanceRequests[0]?.id || maintenanceRequests[0]?._id || "",
      rating: 5,
      title: "",
      comment: "",
    });
    setIsSubmitOpen(true);
  };

  const onSubmit = (values) => {
    createReviewMutation.mutate(values, {
      onSuccess: () => {
        setIsSubmitOpen(false);
        reset();
      },
    });
  };

  const handleOpenModerate = (review, status) => {
    setModerateDialogReview(review);
    setTargetModerationStatus(status);
    setModerationReason("");
  };

  const handleModerateConfirm = () => {
    if (!moderateDialogReview) return;
    const payload = {
      moderationStatus: targetModerationStatus,
      ...(moderationReason ? { moderationReason: moderationReason.trim() } : {}),
    };

    moderateMutation.mutate(
      { id: moderateDialogReview.id || moderateDialogReview._id, data: payload },
      {
        onSuccess: () => {
          setModerateDialogReview(null);
          setModerationReason("");
        },
      }
    );
  };

  const columns = [
    {
      id: "technician",
      label: "Technician & Trade",
      render: (_, row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: DESIGN_TOKENS.brand[600], fontSize: "0.875rem", fontWeight: 700 }}>
            {row.staff?.user?.firstName?.[0] || "T"}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
              {row.staff?.user ? `${row.staff.user.firstName} ${row.staff.user.lastName}` : "Staff Member"}
            </Typography>
            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
              {row.staff?.subCategory || row.staff?.designation || "Maintenance Staff"}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: "rating",
      label: "Rating Score",
      render: (val) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Rating value={val || 5} precision={1} size="small" readOnly />
          <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
            {val || 5}/5
          </Typography>
        </Stack>
      ),
    },
    {
      id: "comment",
      label: "Resident Feedback",
      render: (_, row) => (
        <Box sx={{ maxWidth: 360 }}>
          {row.title && (
            <Typography sx={{ fontWeight: 600, fontSize: "0.8125rem", color: DESIGN_TOKENS.text.primary }}>
              {row.title}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem" }}>
            "{row.comment || "Service performed with high professionalism."}"
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.brand[600], display: "block", mt: 0.25 }}>
            By: {row.reviewer?.firstName} {row.reviewer?.lastName}
          </Typography>
        </Box>
      ),
    },
    {
      id: "moderationStatus",
      label: "Moderation",
      render: (val) => {
        const isApproved = val === "APPROVED";
        const isFlagged = val === "FLAGGED";
        const isHidden = val === "HIDDEN";
        return (
          <Chip
            label={val || "APPROVED"}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: isApproved ? "#F0FDF4" : isFlagged ? "#FFFBEB" : isHidden ? "#FEF2F2" : "#F8FAFC",
              color: isApproved ? "#16A34A" : isFlagged ? "#D97706" : isHidden ? "#DC2626" : DESIGN_TOKENS.text.secondary,
            }}
          />
        );
      },
    },
    {
      id: "actions",
      label: "Moderation Actions",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.REVIEW_MODERATE}>
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {row.moderationStatus !== "APPROVED" && (
              <Tooltip title="Approve Review">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleOpenModerate(row, "APPROVED")}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {row.moderationStatus !== "FLAGGED" && (
              <Tooltip title="Flag Review for Policy Breach">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleOpenModerate(row, "FLAGGED")}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <FlagIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {row.moderationStatus !== "HIDDEN" && (
              <Tooltip title="Hide Review from Public View">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOpenModerate(row, "HIDDEN")}
                  sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                >
                  <VisibilityOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reviews & Service Ratings"
        subtitle="Work order satisfaction feedback, technician performance reviews, and content moderation"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reviews" }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{
                bgcolor: "#FFFFFF",
                border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                borderRadius: "8px",
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: 1.5,
                  py: 0.5,
                  color: DESIGN_TOKENS.text.secondary,
                  "&.Mui-selected": {
                    bgcolor: DESIGN_TOKENS.brand[50],
                    color: DESIGN_TOKENS.brand[600],
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ToggleButton value="cards">
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="table">
                <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.REVIEW_CREATE}>
              <Button
                variant="contained"
                startIcon={<RateReviewIcon />}
                onClick={handleOpenSubmit}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Submit Review
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#FFFBEB",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StarIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Overall Satisfaction
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : `${averageRating} / 5.0`}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F0FDF4",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                5-Star Work Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : fiveStarCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                bgcolor: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlagIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Moderation Queue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : `${flaggedCount} Flagged`}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reviews by comments, technician, or resident..."
        onReset={() => {
          setSearch("");
          setModerationFilter("");
          setStaffFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || moderationFilter || staffFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Moderation Status</InputLabel>
          <Select
            value={moderationFilter}
            label="Moderation Status"
            onChange={(e) => {
              setModerationFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Reviews</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="PENDING">Pending Moderation</MenuItem>
            <MenuItem value="FLAGGED">Flagged for Review</MenuItem>
            <MenuItem value="HIDDEN">Hidden</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Staff</InputLabel>
          <Select
            value={staffFilter}
            label="Filter by Staff"
            onChange={(e) => {
              setStaffFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Personnel</MenuItem>
            {staffList.map((s) => (
              <MenuItem key={s.id || s._id} value={s.id || s._id}>
                {s.user?.firstName} {s.user?.lastName} ({s.subCategory || s.category})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          title="No service reviews recorded"
          description="Residents have not yet submitted reviews for completed work orders."
          action={
            <Button variant="contained" startIcon={<RateReviewIcon />} onClick={handleOpenSubmit}>
              Submit First Review
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredReviews.map((rev) => {
            const rId = rev.id || rev._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={rId}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    borderColor: DESIGN_TOKENS.line[200],
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    "&:hover": {
                      borderColor: DESIGN_TOKENS.brand[600],
                      boxShadow: "0 6px 18px -3px rgba(15, 23, 42, 0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Rating value={rev.rating || 5} precision={1} size="small" readOnly />
                      <Chip
                        label={rev.moderationStatus || "APPROVED"}
                        size="small"
                        sx={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          bgcolor: rev.moderationStatus === "APPROVED" ? "#F0FDF4" : "#FFFBEB",
                          color: rev.moderationStatus === "APPROVED" ? "#16A34A" : "#D97706",
                        }}
                      />
                    </Box>

                    {rev.title && (
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: DESIGN_TOKENS.text.primary, mb: 0.5 }}>
                        {rev.title}
                      </Typography>
                    )}

                    <Typography
                      variant="body2"
                      sx={{
                        color: DESIGN_TOKENS.text.secondary,
                        fontSize: "0.8125rem",
                        mb: 2,
                        fontStyle: "italic",
                        minHeight: 40,
                      }}
                    >
                      "{rev.comment || "Technician was punctual and resolved the issue thoroughly."}"
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}` }}>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        Technician Evaluated
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                        {rev.staff?.user?.firstName} {rev.staff?.user?.lastName} ({rev.staff?.subCategory || "Technician"})
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.brand[600], display: "block", mt: 0.5 }}>
                        Resident: {rev.reviewer?.firstName} {rev.reviewer?.lastName}
                      </Typography>
                    </Box>
                  </Box>

                  <PermissionGuard permission={PERMISSIONS.REVIEW_MODERATE}>
                    <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      {rev.moderationStatus !== "APPROVED" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleOpenModerate(rev, "APPROVED")}
                        >
                          Approve
                        </Button>
                      )}

                      {rev.moderationStatus !== "FLAGGED" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleOpenModerate(rev, "FLAGGED")}
                        >
                          Flag
                        </Button>
                      )}
                    </Box>
                  </PermissionGuard>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredReviews}
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

      {/* Submit Review Dialog */}
      <Dialog
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Submit Technician Service Rating
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createReviewMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createReviewMutation.error?.response?.data?.message || "Failed to submit review."}
              </Alert>
            )}

            <FormControl fullWidth size="small" error={Boolean(errors.maintenanceRequestId)}>
              <InputLabel>Associated Work Order Ticket</InputLabel>
              <Select label="Associated Work Order Ticket" defaultValue="" {...register("maintenanceRequestId")}>
                {maintenanceRequests.map((req) => (
                  <MenuItem key={req.id || req._id} value={req.id || req._id}>
                    Ticket #{req.ticketNumber || (req.id || req._id).slice(-6)} - {req.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.secondary, display: "block", mb: 0.5 }}>
                Service Satisfaction Rating
              </Typography>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <Rating
                    value={Number(field.value) || 5}
                    onChange={(_, val) => field.onChange(val)}
                    size="large"
                  />
                )}
              />
            </Box>

            <TextField
              label="Headline Summary (Optional)"
              placeholder="e.g. Excellent service and rapid plumbing fix"
              size="small"
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register("title")}
            />

            <TextField
              label="Detailed Feedback Comments (Optional)"
              placeholder="Share details about punctuality, cleanliness, and repair quality..."
              multiline
              rows={3}
              fullWidth
              error={Boolean(errors.comment)}
              helperText={errors.comment?.message}
              {...register("comment")}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={() => setIsSubmitOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createReviewMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Moderation Action Modal */}
      <Dialog
        open={Boolean(moderateDialogReview)}
        onClose={() => setModerateDialogReview(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Moderate Review Content ({targetModerationStatus})
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {moderateMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {moderateMutation.error?.response?.data?.message || "Failed to moderate review."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Review: <em>"{moderateDialogReview?.comment || moderateDialogReview?.title}"</em>
          </Typography>

          {["FLAGGED", "HIDDEN"].includes(targetModerationStatus) && (
            <TextField
              label="Reason for Moderation (Required)"
              placeholder="Specify policy violation (e.g. offensive language, personal information disclosure)..."
              multiline
              rows={3}
              fullWidth
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              helperText="Reason is strictly mandated by compliance policies when flagging or hiding reviews"
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setModerateDialogReview(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              (["FLAGGED", "HIDDEN"].includes(targetModerationStatus) && !moderationReason.trim()) ||
              moderateMutation.isPending
            }
            onClick={handleModerateConfirm}
            sx={{
              bgcolor: targetModerationStatus === "APPROVED" ? "#16A34A" : targetModerationStatus === "FLAGGED" ? "#D97706" : "#DC2626",
              fontWeight: 600,
            }}
          >
            {moderateMutation.isPending ? "Applying..." : `Confirm ${targetModerationStatus}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewsListPage;
