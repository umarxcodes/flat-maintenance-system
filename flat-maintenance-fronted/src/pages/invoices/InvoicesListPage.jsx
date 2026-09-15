// =====================  INVOICES LIST PAGE  ==================
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
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { formatCurrency } from "../../utils/format-currency.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

const batchSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  month: z.coerce.number().min(1).max(12, "Month must be between 1 and 12"),
  year: z.coerce.number().min(2020),
  dueDate: z.string().min(1, "Due date is required"),
});

const getDefaultBatchValues = () => {
  const now = new Date();
  const future = new Date(now.getTime() + 15 * 86400000);
  return {
    buildingId: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dueDate: future.toISOString().slice(0, 10),
  };
};

export const InvoicesListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

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

  const rawInvoices = data?.invoices || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawInvoices.length;

  const filteredInvoices = useMemo(() => {
    if (!search) return rawInvoices;
    const q = search.toLowerCase();
    return rawInvoices.filter((inv) => {
      const invNo = (inv.invoiceNumber || "").toLowerCase();
      const flatNo = String(inv.flat?.flatNumber || inv.flatId || "").toLowerCase();
      const period = (inv.billingPeriod || "").toLowerCase();
      return invNo.includes(q) || flatNo.includes(q) || period.includes(q);
    });
  }, [rawInvoices, search]);

  // Metrics
  const totalOutstanding = useMemo(
    () => rawInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0),
    [rawInvoices]
  );
  const overdueCount = useMemo(
    () => rawInvoices.filter((inv) => inv.status === STATUSES.INVOICE.OVERDUE).length,
    [rawInvoices]
  );
  const paidCount = useMemo(
    () => rawInvoices.filter((inv) => inv.status === STATUSES.INVOICE.PAID).length,
    [rawInvoices]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: getDefaultBatchValues(),
  });

  const handleOpenBatch = () => {
    reset({
      ...getDefaultBatchValues(),
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
    });
    setIsBatchOpen(true);
  };

  const onBatchSubmit = (values) => {
    const formattedPeriod = `${values.year}-${String(values.month).padStart(2, "0")}`;
    const payload = {
      buildingId: values.buildingId,
      billingPeriod: formattedPeriod,
      dueDate: new Date(values.dueDate).toISOString(),
      status: "ISSUED",
    };

    batchMutation.mutate(payload, {
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
      label: "Invoice Voucher",
      render: (val, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
            {val || `INV-${(row.id || row._id).slice(-6).toUpperCase()}`}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Period: {row.billingPeriod || `${row.billingMonth}/${row.billingYear}`} • Flat {row.flat?.flatNumber || "Unit"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "building",
      label: "Building Complex",
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
          {row.building?.name || "Al-Raziq Heights"}
        </Typography>
      ),
    },
    {
      id: "totalAmount",
      label: "Billed Total",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
          {formatCurrency(val || 0)}
        </Typography>
      ),
    },
    {
      id: "dueAmount",
      label: "Outstanding Due",
      render: (val) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: val > 0 ? "error.main" : "success.main" }}
        >
          {formatCurrency(val || 0)}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Invoice Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => {
        const invId = row.id || row._id;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate(`/invoices/${invId}`)}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "none",
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.brand[600],
                "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
              }}
            >
              Inspect
            </Button>

            {row.dueAmount > 0 && row.status !== STATUSES.INVOICE.VOID && (
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate(`/payments?invoiceId=${invId}`)}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  textTransform: "none",
                }}
              >
                Pay
              </Button>
            )}

            {row.status !== STATUSES.INVOICE.VOID && (
              <PermissionGuard permission={PERMISSIONS.INVOICE_VOID}>
                <Tooltip title="Void Invoice Voucher">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setVoidInvoice(row)}
                    sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}` }}
                  >
                    <BlockIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Invoices & Billing Vouchers"
        subtitle="Automated periodic maintenance fee calculations, batch generation, and outstanding receivables"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Invoices" }]}
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

            <PermissionGuard permission={PERMISSIONS.INVOICE_CREATE}>
              <Button
                variant="contained"
                startIcon={<ReceiptLongIcon />}
                onClick={handleOpenBatch}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Generate Batch
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
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Total Outstanding Receivables
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : formatCurrency(totalOutstanding)}
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
              <WarningAmberIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Overdue Invoices
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : overdueCount}
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
                Paid in Full
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : paidCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices by voucher number, flat, or period..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Invoice Status</InputLabel>
          <Select
            value={statusFilter}
            label="Invoice Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(STATUSES.INVOICE).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Building</InputLabel>
          <Select
            value={buildingFilter}
            label="Building"
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Buildings</MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Generate your first monthly billing batch for the complex."
          action={
            <Button variant="contained" startIcon={<ReceiptLongIcon />} onClick={handleOpenBatch}>
              Generate First Batch
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredInvoices.map((inv) => {
            const invId = inv.id || inv._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={invId}>
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                          {inv.invoiceNumber || `INV-${invId.slice(-6).toUpperCase()}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Billing Period: {inv.billingPeriod || `${inv.billingMonth}/${inv.billingYear}`}
                        </Typography>
                      </Box>
                      <StatusChip status={inv.status} />
                    </Box>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Unit Assessed
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
                          Flat {inv.flat?.flatNumber || inv.flatId || "Unit"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        {inv.building?.name || "Al-Raziq Heights"}
                      </Typography>

                      <Divider sx={{ my: 1, borderColor: DESIGN_TOKENS.line[200] }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Due Balance
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 800, color: inv.dueAmount > 0 ? "error.main" : "success.main" }}
                        >
                          {formatCurrency(inv.dueAmount || 0)}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Payment Due Date: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(`/invoices/${invId}`)}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: DESIGN_TOKENS.line[200],
                        color: DESIGN_TOKENS.brand[600],
                        "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
                      }}
                    >
                      Breakdown
                    </Button>

                    {inv.dueAmount > 0 && inv.status !== STATUSES.INVOICE.VOID && (
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/payments?invoiceId=${invId}`)}
                        sx={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          bgcolor: DESIGN_TOKENS.brand[600],
                          "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                          textTransform: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Pay
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredInvoices}
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
      )}

      {/* Generate Batch Billing Dialog */}
      <Dialog
        open={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Generate Periodic Maintenance Invoices
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onBatchSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {batchMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {batchMutation.error?.response?.data?.message || "Failed to generate invoice batch."}
              </Alert>
            )}

            <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
              <InputLabel>Building Complex</InputLabel>
              <Select label="Building Complex" defaultValue="" {...register("buildingId")}>
                {buildings.map((b) => (
                  <MenuItem key={b.id || b._id} value={b.id || b._id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Billing Month (1–12)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.month)}
                  helperText={errors.month?.message}
                  {...register("month")}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Billing Year (YYYY)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.year)}
                  helperText={errors.year?.message}
                  {...register("year")}
                />
              </Grid>
            </Grid>

            <TextField
              label="Invoice Due Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.dueDate)}
              helperText={errors.dueDate?.message}
              {...register("dueDate")}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={() => setIsBatchOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={batchMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {batchMutation.isPending ? "Generating..." : "Issue Invoices"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Void Invoice Confirmation */}
      <ConfirmDialog
        open={Boolean(voidInvoice)}
        title="Void Invoice Voucher"
        description={`Are you sure you want to void invoice ${voidInvoice?.invoiceNumber || voidInvoice?._id}? This will cancel all unpaid balances on this voucher.`}
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
