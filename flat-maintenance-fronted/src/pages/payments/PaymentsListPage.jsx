// =====================  PAYMENTS TRANSACTION LEDGER  =========
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
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePaymentsList, useCreatePaymentMutation } from "../../features/payments/hooks/use-payments.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
  "CHEQUE",
];

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "UPI",
    "CHEQUE",
  ]),
  transactionReference: z.string().min(1, "Transaction reference / cheque no. is required"),
});

export const PaymentsListPage = () => {
  const [searchParams] = useSearchParams();
  const defaultInvoiceId = searchParams.get("invoiceId") || "";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [methodFilter, setMethodFilter] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(Boolean(defaultInvoiceId));

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(methodFilter && { paymentMethod: methodFilter }),
  };

  const { data, isLoading } = usePaymentsList(queryParams);
  const createPaymentMutation = useCreatePaymentMutation();

  const payments = data?.payments || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || payments.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: defaultInvoiceId,
      amount: 1000,
      paymentMethod: "UPI",
      transactionReference: "",
    },
  });

  const handleOpenRecord = () => {
    reset({
      invoiceId: defaultInvoiceId,
      amount: 1000,
      paymentMethod: "UPI",
      transactionReference: "",
    });
    setIsRecordOpen(true);
  };

  const onSubmit = (values) => {
    createPaymentMutation.mutate(values, {
      onSuccess: () => {
        setIsRecordOpen(false);
      },
    });
  };

  const columns = [
    {
      id: "receiptNumber",
      label: "Receipt / Trx ID",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val || row.transactionReference || row._id?.slice(-8)}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Invoice: {row.invoice?.invoiceNumber || row.invoiceId?.slice?.(-6) || row.invoiceId}
          </Box>
        </Box>
      ),
    },
    {
      id: "amount",
      label: "Amount Paid ($)",
      render: (val) => (
        <Box sx={{ fontWeight: 700, color: "success.main" }}>
          ${val?.toLocaleString() || "0"}
        </Box>
      ),
    },
    {
      id: "paymentMethod",
      label: "Payment Channel",
      render: (val) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: "createdAt",
      label: "Date & Time",
      render: (val) => (val ? new Date(val).toLocaleString() : "-"),
    },
    {
      id: "actions",
      label: "Receipt",
      align: "right",
      render: (_, row) => (
        <Tooltip title="Download Receipt">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              window.open(`/api/v1/payments/${row.id || row._id}/receipt`, "_blank");
            }}
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
        title="Payment Transactions Ledger"
        subtitle="Immutable financial reconciliation ledger and receipts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payments" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.PAYMENT_CREATE}>
            <Button variant="contained" startIcon={<PaymentIcon />} onClick={handleOpenRecord}>
              Record Payment
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        onReset={() => {
          setMethodFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(methodFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={methodFilter}
            label="Payment Method"
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Methods</em>
            </MenuItem>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={payments}
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

      {/* Record Payment Dialog */}
      <Dialog open={isRecordOpen} onClose={() => setIsRecordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Record Payment Settlement</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createPaymentMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createPaymentMutation.error?.message || "Failed to process payment."}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                label="Invoice ID"
                placeholder="Invoice ObjectId"
                fullWidth
                error={Boolean(errors.invoiceId)}
                helperText={errors.invoiceId?.message}
                {...register("invoiceId")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Settlement Amount ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  {...register("amount")}
                />

                <FormControl fullWidth size="small" error={Boolean(errors.paymentMethod)}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select label="Payment Method" defaultValue="UPI" {...register("paymentMethod")}>
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Transaction Reference / Cheque No."
                placeholder="e.g. UPI-9988223311 or CHQ-00129"
                fullWidth
                error={Boolean(errors.transactionReference)}
                helperText={errors.transactionReference?.message}
                {...register("transactionReference")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsRecordOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PaymentsListPage;
