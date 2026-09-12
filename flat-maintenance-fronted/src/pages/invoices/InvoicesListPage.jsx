// =====================  INVOICES LIST PAGE  ==================
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
import Typography from "@mui/material/Typography";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useInvoicesList,
  useGenerateBatchMutation,
  useVoidInvoiceMutation,
} from "../../features/invoices/hooks/use-invoices.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const batchSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  month: z.coerce.number().min(1).max(12, "Month must be between 1 and 12"),
  year: z.coerce.number().min(2020),
  dueDate: z.string().min(1, "Due date is required"),
});

export const InvoicesListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [voidInvoice, setVoidInvoice] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useInvoicesList(queryParams);
  const batchMutation = useGenerateBatchMutation();
  const voidMutation = useVoidInvoiceMutation();

  const invoices = data?.invoices || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || invoices.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      buildingId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    },
  });

  const onBatchSubmit = (values) => {
    batchMutation.mutate(values, {
      onSuccess: () => {
        setIsBatchOpen(false);
        reset();
      },
    });
  };

  const handleVoidConfirm = () => {
    if (!voidInvoice) return;
    voidMutation.mutate(voidInvoice.id || voidInvoice._id, {
      onSuccess: () => {
        setVoidInvoice(null);
      },
    });
  };

  const columns = [
    {
      id: "invoiceNumber",
      label: "Invoice No.",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 700 }}>{val || `INV-${row._id?.slice(-6)}`}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Flat {row.flat?.flatNumber || "Unit"} • Period: {row.billingMonth}/{row.billingYear}
          </Box>
        </Box>
      ),
    },
    {
      id: "totalAmount",
      label: "Total ($)",
      render: (val) => `$${val?.toLocaleString() || "0"}`,
    },
    {
      id: "dueAmount",
      label: "Due Balance ($)",
      render: (val) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: val > 0 ? "error.main" : "success.main" }}
        >
          ${val?.toLocaleString() || "0"}
        </Typography>
      ),
    },
    {
      id: "dueDate",
      label: "Due Date",
      render: (val) => (val ? val.slice(0, 10) : "-"),
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View Invoice">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/invoices/${row.id || row._id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <PermissionGuard permission={PERMISSIONS.INVOICE_UPDATE}>
            {row.status !== "PAID" && row.status !== "VOID" && (
              <Tooltip title="Void Invoice">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVoidInvoice(row);
                  }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Maintenance Invoices"
        subtitle="Manage billing batches, track payments, review arrears, and process invoice voiding"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.INVOICE_GENERATE}>
            <Button
              variant="contained"
              startIcon={<ReceiptLongIcon />}
              onClick={() => {
                reset();
                setIsBatchOpen(true);
              }}
            >
              Generate Monthly Batch
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        onReset={() => {
          setStatusFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(statusFilter || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            {Object.values(STATUSES.INVOICE).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
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
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={invoices}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        onRowClick={(row) => navigate(`/invoices/${row.id || row._id}`)}
      />

      {/* Batch Generation Modal */}
      <Dialog open={isBatchOpen} onClose={() => setIsBatchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Execute Monthly Batch Invoice Run</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onBatchSubmit)} noValidate>
          <DialogContent dividers>
            {batchMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {batchMutation.error?.message || "Failed to generate batch."}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" paragraph>
              This triggers the billing engine to calculate authoritative maintenance charges for all units in the selected complex using the active maintenance configuration.
            </Typography>

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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Billing Month (1 - 12)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.month)}
                  helperText={errors.month?.message}
                  {...register("month")}
                />

                <TextField
                  label="Billing Year"
                  type="number"
                  fullWidth
                  error={Boolean(errors.year)}
                  helperText={errors.year?.message}
                  {...register("year")}
                />
              </Stack>

              <TextField
                label="Payment Due Date"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.dueDate)}
                helperText={errors.dueDate?.message}
                {...register("dueDate")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsBatchOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={batchMutation.isPending}>
              {batchMutation.isPending ? "Generating..." : "Trigger Batch Invoices"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Void Invoice Confirmation */}
      <ConfirmDialog
        open={Boolean(voidInvoice)}
        title="Void Invoice"
        description={`Are you sure you want to void invoice ${voidInvoice?.invoiceNumber || voidInvoice?._id}? This action marks the balance as uncollectible.`}
        confirmLabel="Void Invoice"
        confirmColor="error"
        isLoading={voidMutation.isPending}
        onConfirm={handleVoidConfirm}
        onCancel={() => setVoidInvoice(null)}
      />
    </Box>
  );
};

export default InvoicesListPage;
