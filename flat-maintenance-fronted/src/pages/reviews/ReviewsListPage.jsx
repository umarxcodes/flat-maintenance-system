// =====================  REVIEWS & SERVICE RATINGS  ===========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FlagIcon from "@mui/icons-material/Flag";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useReviewsList,
  useCreateReviewMutation,
  useModerateReviewMutation,
} from "../../features/reviews/hooks/use-reviews.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const reviewSchema = z.object({
  requestId: z.string().min(1, "Work Order / Request ID is required"),
  staffId: z.string().min(1, "Technician ID is required"),
  rating: z.number().min(1, "Rating must be at least 1 star").max(5),
  comment: z.string().min(1, "Feedback comments are required"),
});

export const ReviewsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
  };

  const { data, isLoading } = useReviewsList(queryParams);
  const createReviewMutation = useCreateReviewMutation();
  const moderateMutation = useModerateReviewMutation();

  const reviews = data?.reviews || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || reviews.length;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      requestId: "",
      staffId: "",
      rating: 5,
      comment: "",
    },
  });

  const onSubmit = (values) => {
    createReviewMutation.mutate(values, {
      onSuccess: () => {
        setIsSubmitOpen(false);
        reset();
      },
    });
  };

  const handleModerate = (reviewId, status) => {
    moderateMutation.mutate({ id: reviewId, data: { moderationStatus: status } });
  };

  const columns = [
    {
      id: "technician",
      label: "Technician",
      render: (_, row) =>
        row.staff ? `${row.staff.user?.firstName} ${row.staff.user?.lastName}` : "Staff Member",
    },
    {
      id: "rating",
      label: "Rating",
      render: (val) => <Rating value={val || 5} precision={0.5} size="small" readOnly />,
    },
    {
      id: "comment",
      label: "Resident Feedback",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 500 }}>"{val}"</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            By: {row.reviewer?.firstName} {row.reviewer?.lastName}
          </Box>
        </Box>
      ),
    },
    {
      id: "status",
      label: "Moderation",
      render: (_, row) => <StatusChip status={row.moderationStatus || "PUBLISHED"} />,
    },
    {
      id: "actions",
      label: "Moderation Actions",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.REVIEW_MODERATE}>
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Flag Review">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleModerate(row.id || row._id, "FLAGGED")}
              >
                <FlagIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hide Review">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleModerate(row.id || row._id, "HIDDEN")}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Service Ratings & Reviews"
        subtitle="Review resident satisfaction ratings, feedback comments, and moderation controls"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reviews" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.REVIEW_CREATE}>
            <Button
              variant="contained"
              startIcon={<RateReviewIcon />}
              onClick={() => {
                reset();
                setIsSubmitOpen(true);
              }}
            >
              Leave a Review
            </Button>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        rows={reviews}
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

      {/* Leave Review Dialog */}
      <Dialog open={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Submit Service Rating</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createReviewMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createReviewMutation.error?.message || "Failed to submit review."}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <TextField
                label="Completed Work Order ID"
                placeholder="Maintenance Request ObjectId"
                fullWidth
                error={Boolean(errors.requestId)}
                helperText={errors.requestId?.message}
                {...register("requestId")}
              />

              <TextField
                label="Staff Technician ID"
                placeholder="Staff Member ObjectId"
                fullWidth
                error={Boolean(errors.staffId)}
                helperText={errors.staffId?.message}
                {...register("staffId")}
              />

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                  display="block"
                >
                  Rating (1 to 5 Stars)
                </Typography>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <Rating
                      value={field.value}
                      onChange={(_, newVal) => field.onChange(newVal)}
                      size="large"
                    />
                  )}
                />
              </Box>

              <TextField
                label="Feedback Comment"
                multiline
                rows={3}
                fullWidth
                error={Boolean(errors.comment)}
                helperText={errors.comment?.message}
                {...register("comment")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsSubmitOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ReviewsListPage;
