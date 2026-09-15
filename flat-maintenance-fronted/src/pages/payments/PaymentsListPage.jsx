// =====================  PAYMENTS TRANSACTION LEDGER  =========
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
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  usePaymentsList,
  useCreatePaymentMutation,
} from "../../features/payments/hooks/use-payments.js";
import { useInvoicesList } from "../../features/invoices/hooks/use-invoices.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { formatCurrency } from "../../utils/format-currency.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "UPI", "CHEQUE"];

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice voucher is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionRef: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const PaymentsListPage = () => {
  const [searchParams] = useSearchParams();
  const defaultInvoiceId = searchParams.get("invoiceId") || "";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [isRecordOpen, setIsRecordOpen] = useState(Boolean(defaultInvoiceId));
  const [selectedPayment, setSelectedPayment] = useState(null);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(methodFilter && { paymentMethod: methodFilter }),
  };

  const { data, isLoading } = usePaymentsList(queryParams);
  const createPaymentMutation = useCreatePaymentMutation();

  const { data: invoicesData } = useInvoicesList({ limit: 100 });
  const unpaidInvoices = useMemo(() => {
    const list = invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []);
    return list.filter((inv) => inv.dueAmount > 0 && inv.status !== "VOID");
  }, [invoicesData]);

  const rawPayments = data?.payments || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawPayments.length;

  const filteredPayments = useMemo(() => {
    if (!search) return rawPayments;
    const q = search.toLowerCase();
    return rawPayments.filter((p) => {
      const pNo = (p.paymentNumber || "").toLowerCase();
      const rNo = (p.receiptNumber || "").toLowerCase();
      const ref = (p.transactionRef || "").toLowerCase();
      const payer = (p.payer?.firstName || "").toLowerCase();
      return pNo.includes(q) || rNo.includes(q) || ref.includes(q) || payer.includes(q);
    });
  }, [rawPayments, search]);

  // Metrics
  const totalCollected = useMemo(
    () => rawPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [rawPayments]
  );
  const digitalPaymentsCount = useMemo(
    () => rawPayments.filter((p) => ["BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "UPI"].includes(p.paymentMethod)).length,
    [rawPayments]
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: defaultInvoiceId,
      amount: 5000,
      paymentMethod: "BANK_TRANSFER",
      transactionRef: "",
      notes: "",
    },
  });

  const handleOpenRecord = () => {
    const defaultInv = unpaidInvoices[0];
    reset({
      invoiceId: defaultInv?.id || defaultInv?._id || defaultInvoiceId,
      amount: defaultInv?.dueAmount || 5000,
      paymentMethod: "BANK_TRANSFER",
      transactionRef: "",
      notes: "",
    });
    setIsRecordOpen(true);
  };

  const onSubmit = (values) => {
    const payload = {
      invoiceId: values.invoiceId,
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod,
      ...(values.transactionRef ? { transactionRef: values.transactionRef } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };

    createPaymentMutation.mutate(payload, {
      onSuccess: () => {
        setIsRecordOpen(false);
        reset();
      },
    });
  };

  const columns = [
    {
      id: "receiptNumber",
      label: "Receipt & Transaction",
      render: (val, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
            {val || row.paymentNumber || `REC-${(row.id || row._id).slice(-8).toUpperCase()}`}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Invoice: {row.invoice?.invoiceNumber || (row.invoiceId ? row.invoiceId.slice(-6) : "-")}
            {row.transactionRef ? ` • Ref: ${row.transactionRef}` : ""}
          </Typography>
        </Box>
      ),
    },
    {
      id: "amount",
      label: "Payment Amount",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#16A34A" }}>
          {formatCurrency(val || 0)}
        </Typography>
      ),
    },
    {
      id: "paymentMethod",
      label: "Payment Channel",
      render: (val) => (
        <Chip
          label={val?.replace("_", " ")}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: DESIGN_TOKENS.brand[50],
            color: DESIGN_TOKENS.brand[600],
          }}
        />
      ),
    },
    {
      id: "createdAt",
      label: "Settlement Timestamp",
      render: (val) => (
        <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: DESIGN_TOKENS.text.secondary }}>
          {val ? new Date(val).toLocaleString() : "-"}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Receipt",
      align: "right",
      render: (_, row) => (
        <Tooltip title="View Receipt">
          <IconButton
            size="small"
            onClick={() => setSelectedPayment(row)}
            sx={{ border: `1px solid ${DESIGN_TOKENS.line[200]}`, color: DESIGN_TOKENS.brand[600] }}
          >
            <ReceiptIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Payments & Revenue Ledger"
        subtitle="Real-time collection reconciliation, payment receipts, multi-channel processing, and audit logs"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Payments" }]}
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

            <PermissionGuard permission={PERMISSIONS.PAYMENT_CREATE}>
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={handleOpenRecord}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Record Payment
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
                Total Revenue Collected
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : formatCurrency(totalCollected)}
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
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCardIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Digital Transfers & Cards
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : digitalPaymentsCount}
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
                bgcolor: "#F8FAFC",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Total Transactions
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : totalCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payments by receipt, transaction ref, or payer..."
        onReset={() => {
          setSearch("");
          setMethodFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || methodFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Payment Channel</InputLabel>
          <Select
            value={methodFilter}
            label="Payment Channel"
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Channels</MenuItem>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m.replace("_", " ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payment transactions found"
          description="Record resident maintenance fee payments or adjust filter criteria."
          action={
            <Button variant="contained" startIcon={<PaymentIcon />} onClick={handleOpenRecord}>
              Record First Payment
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredPayments.map((p) => {
            const pId = p.id || p._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={pId}>
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
                      <Chip
                        label={p.paymentMethod?.replace("_", " ") || "CASH"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                        }}
                      />
                      <Chip
                        label="SUCCESS"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.6875rem",
                          bgcolor: "#F0FDF4",
                          color: "#16A34A",
                        }}
                      />
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#16A34A", mb: 0.5 }}>
                      {formatCurrency(p.amount || 0)}
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary, mb: 1.5 }}>
                      Receipt: {p.receiptNumber || p.paymentNumber || `REC-${pId.slice(-8).toUpperCase()}`}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        Invoice Associated
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
                        {p.invoice?.invoiceNumber || (p.invoiceId ? `INV-${p.invoiceId.slice(-6)}` : "-")}
                      </Typography>

                      {p.transactionRef && (
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block", mt: 0.5 }}>
                          Trx Ref: {p.transactionRef}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Settled: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedPayment(p)}
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
                      View Receipt
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredPayments}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedPayment(row)}
        />
      )}

      {/* Record Payment Dialog */}
      <Dialog
        open={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Record Received Maintenance Payment
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createPaymentMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createPaymentMutation.error?.response?.data?.message || "Failed to record payment."}
              </Alert>
            )}

            <FormControl fullWidth size="small" error={Boolean(errors.invoiceId)}>
              <InputLabel>Outstanding Invoice</InputLabel>
              <Select
                label="Outstanding Invoice"
                defaultValue={defaultInvoiceId || ""}
                {...register("invoiceId")}
                onChange={(e) => {
                  setValue("invoiceId", e.target.value);
                  const matched = unpaidInvoices.find((inv) => (inv.id || inv._id) === e.target.value);
                  if (matched) {
                    setValue("amount", matched.dueAmount);
                  }
                }}
              >
                {unpaidInvoices.map((inv) => (
                  <MenuItem key={inv.id || inv._id} value={inv.id || inv._id}>
                    {inv.invoiceNumber || `INV-${(inv.id || inv._id).slice(-6)}`} — Due: {formatCurrency(inv.dueAmount)} (Flat {inv.flat?.flatNumber || "Unit"})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Amount (PKR)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  {...register("amount")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Channel</InputLabel>
                  <Select label="Payment Channel" defaultValue="BANK_TRANSFER" {...register("paymentMethod")}>
                    {PAYMENT_METHODS.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m.replace("_", " ")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Transaction / Cheque Reference (Optional)"
              placeholder="e.g. TRX-9823412 or Cheque #002341"
              size="small"
              fullWidth
              error={Boolean(errors.transactionRef)}
              helperText={errors.transactionRef?.message}
              {...register("transactionRef")}
            />

            <TextField
              label="Payment Notes (Optional)"
              placeholder="Bank branch details or reconciliation notes..."
              multiline
              rows={2}
              fullWidth
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message}
              {...register("notes")}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={() => setIsRecordOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createPaymentMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {createPaymentMutation.isPending ? "Recording..." : "Issue Payment Receipt"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Payment Receipt Inspection Modal */}
      <Dialog
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "#16A34A", fontWeight: 700 }}>
              <ReceiptIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                Official Payment Receipt
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {selectedPayment?.receiptNumber || selectedPayment?.paymentNumber || `REC-${selectedPayment?.id?.slice(-8).toUpperCase()}`}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, textTransform: "uppercase", fontWeight: 700 }}>
                Amount Paid
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#16A34A" }}>
                {formatCurrency(selectedPayment?.amount || 0)}
              </Typography>
              <Chip
                label="SETTLED & CLEARED"
                size="small"
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  fontSize: "0.6875rem",
                  bgcolor: "#F0FDF4",
                  color: "#16A34A",
                }}
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Payment Channel
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    {selectedPayment?.paymentMethod?.replace("_", " ")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Transaction Ref
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.brand[600] }}>
                    {selectedPayment?.transactionRef || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Settled Timestamp
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    {selectedPayment?.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedPayment(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsListPage;
