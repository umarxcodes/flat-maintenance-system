// =====================  OPERATIONAL EXPENSES PAGE  ===========
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
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useExpensesList,
  useCreateExpenseMutation,
  useApproveExpenseMutation,
} from "../../features/expenses/hooks/use-expenses.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const EXPENSE_CATEGORIES = [
  "UTILITIES",
  "SECURITY_SALARIES",
  "MAINTENANCE_AMC",
  "REPAIRS",
  "CLEANING_SUPPLIES",
  "LEGAL",
  "OTHER",
];

const expenseSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  description: z.string().optional(),
});

export const ExpensesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveExpenseTarget, setApproveExpenseTarget] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useExpensesList(queryParams);
  const createMutation = useCreateExpenseMutation();
  const approveMutation = useApproveExpenseMutation();

  const expenses = data?.expenses || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || expenses.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      buildingId: "",
      title: "",
      amount: 1500,
      category: "UTILITIES",
      vendorName: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      },
    });
  };

  const handleApproveConfirm = () => {
    if (!approveExpenseTarget) return;
    approveMutation.mutate(
      { id: approveExpenseTarget.id || approveExpenseTarget._id, data: { approvalNotes: "Approved for payout" } },
      {
        onSuccess: () => {
          setApproveExpenseTarget(null);
        },
      }
    );
  };

  const columns = [
    {
      id: "title",
      label: "Expense Item / Vendor",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Vendor: {row.vendorName || "Vendor"} • {row.category}
          </Box>
        </Box>
      ),
    },
    {
      id: "amount",
      label: "Disbursement ($)",
      render: (val) => (
        <Box sx={{ fontWeight: 700, color: "text.primary" }}>
          ${val?.toLocaleString() || "0"}
        </Box>
      ),
    },
    {
      id: "category",
      label: "Budget Category",
      render: (val) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: "invoiceDate",
      label: "Invoice Date",
      render: (val) => (val ? val.slice(0, 10) : "-"),
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Authorization",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.EXPENSE_APPROVE}>
          {row.status === "PENDING_APPROVAL" && (
            <Tooltip title="Authorize Payout Disbursement">
              <IconButton
                size="small"
                color="success"
                onClick={() => setApproveExpenseTarget(row)}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Operational Society Expenses"
        subtitle="Track vendor bills, utility payments, maintenance AMCs, and financial disbursements"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Expenses" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.EXPENSE_CREATE}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
            >
              Log Expense
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        onReset={() => {
          setCategoryFilter("");
          setStatusFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(categoryFilter || statusFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
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
            {EXPENSE_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
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
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={expenses}
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

      {/* Log Expense Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Log Society Operational Expense</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create expense."}
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
                label="Expense Title / Description"
                placeholder="e.g. DG Set Diesel Refill"
                fullWidth
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Amount ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  {...register("amount")}
                />

                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" defaultValue="UTILITIES" {...register("category")}>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Vendor / Supplier Name"
                  fullWidth
                  error={Boolean(errors.vendorName)}
                  helperText={errors.vendorName?.message}
                  {...register("vendorName")}
                />

                <TextField
                  label="Invoice Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.invoiceDate)}
                  helperText={errors.invoiceDate?.message}
                  {...register("invoiceDate")}
                />
              </Stack>

              <TextField
                label="Notes (Optional)"
                multiline
                rows={2}
                fullWidth
                {...register("description")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsCreateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Logging..." : "Log Expense"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Approve Expense Confirmation */}
      <ConfirmDialog
        open={Boolean(approveExpenseTarget)}
        title="Authorize Expense Disbursement"
        description={`Are you sure you want to approve disbursement of $${approveExpenseTarget?.amount?.toLocaleString()} for "${approveExpenseTarget?.title}" to vendor ${approveExpenseTarget?.vendorName}?`}
        confirmLabel="Approve Payout"
        confirmColor="success"
        isLoading={approveMutation.isPending}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveExpenseTarget(null)}
      />
    </Box>
  );
};

export default ExpensesListPage;
