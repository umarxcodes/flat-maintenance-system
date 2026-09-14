// =====================  SOCIETY NOTICES & BULLETINS  =========
import React, { useState } from "react";
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
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CampaignIcon from "@mui/icons-material/Campaign";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
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
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const CATEGORIES = ["GENERAL", "MAINTENANCE", "EMERGENCY", "EVENT", "FINANCIAL", "SECURITY"];
const PRIORITIES = ["NORMAL", "HIGH", "URGENT_EMERGENCY"];
const AUDIENCES = ["ALL", "OWNERS_ONLY", "TENANTS_ONLY"];

const noticeSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  title: z.string().min(1, "Notice title is required"),
  content: z.string().min(1, "Notice content is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["NORMAL", "HIGH", "URGENT_EMERGENCY"]),
  audience: z.enum(["ALL", "OWNERS_ONLY", "TENANTS_ONLY"]),
  expiresAt: z.string().optional(),
});

export const NoticesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [retractNotice, setRetractNotice] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
  };

  const { data, isLoading } = useNoticesList(queryParams);
  const publishMutation = usePublishNoticeMutation();
  const retractMutation = useRetractNoticeMutation();

  const notices = data?.notices || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || notices.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      buildingId: "",
      title: "",
      content: "",
      category: "GENERAL",
      priority: "NORMAL",
      audience: "ALL",
      expiresAt: "",
    },
  });

  const onSubmit = (values) => {
    publishMutation.mutate(values, {
      onSuccess: () => {
        setIsPublishOpen(false);
        reset();
      },
    });
  };

  const handleRetractConfirm = () => {
    if (!retractNotice) return;
    retractMutation.mutate(retractNotice.id || retractNotice._id, {
      onSuccess: () => {
        setRetractNotice(null);
      },
    });
  };

  const columns = [
    {
      id: "title",
      label: "Notice Title & Summary",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
            {row.content?.slice(0, 70)}...
          </Box>
        </Box>
      ),
    },
    {
      id: "category",
      label: "Category",
      render: (val) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: "priority",
      label: "Priority",
      render: (val) => {
        const color = val === "URGENT_EMERGENCY" ? "error" : val === "HIGH" ? "warning" : "default";
        return (
          <Chip label={val} color={color} size="small" variant="filled" sx={{ fontWeight: 700 }} />
        );
      },
    },
    {
      id: "audience",
      label: "Target Audience",
      render: (val) => val || "ALL",
    },
    {
      id: "expiresAt",
      label: "Expiry Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "No Expiry"),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.NOTICE_RETRACT}>
          <Tooltip title="Retract Notice">
            <IconButton size="small" color="error" onClick={() => setRetractNotice(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Community Bulletins & Notices"
        subtitle="Broadcast community updates, emergency announcements, maintenance circulars, and notices"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notices" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.NOTICE_CREATE}>
            <Button
              variant="contained"
              startIcon={<CampaignIcon />}
              onClick={() => {
                reset();
                setIsPublishOpen(true);
              }}
            >
              Publish Notice
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        onReset={() => {
          setCategoryFilter("");
          setPriorityFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(categoryFilter || priorityFilter)}
      >
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
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
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
            {PRIORITIES.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={notices}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        emptyTitle="No notices published yet."
      />

      {/* Publish Notice Modal */}
      <Dialog open={isPublishOpen} onClose={() => setIsPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Publish Society Notice</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {publishMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {publishMutation.error?.message || "Failed to publish notice."}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                <InputLabel>Building Complex</InputLabel>
                <Select label="Building Complex" {...register("buildingId")}>
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Notice Title"
                placeholder="e.g. Scheduled Lift Maintenance"
                fullWidth
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" defaultValue="GENERAL" {...register("category")}>
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.priority)}>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" defaultValue="NORMAL" {...register("priority")}>
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" error={Boolean(errors.audience)}>
                  <InputLabel>Audience</InputLabel>
                  <Select label="Audience" defaultValue="ALL" {...register("audience")}>
                    {AUDIENCES.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Notice Bulletin Text"
                multiline
                rows={4}
                fullWidth
                error={Boolean(errors.content)}
                helperText={errors.content?.message}
                {...register("content")}
              />

              <TextField
                label="Expiry Date (Optional)"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                {...register("expiresAt")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPublishOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publishing..." : "Broadcast Notice"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Retract Notice Confirmation */}
      <ConfirmDialog
        open={Boolean(retractNotice)}
        title="Retract Community Notice"
        description={`Are you sure you want to retract notice "${retractNotice?.title}"? It will no longer be visible to residents.`}
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
