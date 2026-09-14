// =====================  OPERATIONAL EXPENSES PAGE  ===========
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
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
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

const EXPENSE_CATEGORIES = [
  "UTILITIES",
  "SECURITY_SALARIES",
  "MAINTENANCE_AMC",
  "REPAIRS",
  "CLEANING_SUPPLIES",
  "LEGAL",
  "OTHER",
];

const CATEGORY_LABELS = {
  UTILITIES: "Utilities (Water/Power)",
  SECURITY_SALARIES: "Security Payroll",
  MAINTENANCE_AMC: "Equipment AMC Contracts",
  REPAIRS: "Physical Repairs",
  CLEANING_SUPPLIES: "Cleaning & Sanitation",
  LEGAL: "Legal & Regulatory",
  OTHER: "Operational Sundry",
};

const expenseSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
  vendorName: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(120),
  category: z.enum(EXPENSE_CATEGORIES, { errorMap: () => ({ message: "Category is required" }) }),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  receiptUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  expenseDate: z.string().min(1, "Expense date is required"),
});

export const ExpensesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveExpenseTarget, setApproveExpenseTarget] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useExpensesList(queryParams);
  const createMutation = useCreateExpenseMutation();
  const approveMutation = useApproveExpenseMutation();

  const rawExpenses = data?.expenses || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || rawExpenses.length;

  const filteredExpenses = useMemo(() => {
    if (!search) return rawExpenses;
    const q = search.toLowerCase();
    return rawExpenses.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const vendor = (e.vendorName || "").toLowerCase();
      const cat = (e.category || "").toLowerCase();
      return title.includes(q) || vendor.includes(q) || cat.includes(q);
    });
  }, [rawExpenses, search]);

  // Metrics
  const totalExpenditure = useMemo(
    () => rawExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [rawExpenses]
  );
  const pendingApprovalAmount = useMemo(
    () =>
      rawExpenses
        .filter((e) => e.status === "PENDING_APPROVAL")
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    [rawExpenses]
  );
  const approvedCount = useMemo(
    () => rawExpenses.filter((e) => e.status === "APPROVED" || e.status === "PAID").length,
    [rawExpenses]
  );

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
      vendorName: "",
      category: "UTILITIES",
      amount: 5000,
      receiptUrl: "",
      expenseDate: new Date().toISOString().slice(0, 10),
    },
  });

  const handleOpenCreate = () => {
    reset({
      buildingId: buildings[0]?.id || buildings[0]?._id || "",
      title: "",
      vendorName: "",
      category: "UTILITIES",
      amount: 5000,
      receiptUrl: "",
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setIsCreateOpen(true);
  };

  const onSubmit = (values) => {
    const payload = {
      buildingId: values.buildingId,
      title: values.title.trim(),
      vendorName: values.vendorName.trim(),
      category: values.category,
      amount: Number(values.amount),
      expenseDate: new Date(values.expenseDate).toISOString(),
      ...(values.receiptUrl ? { receiptUrl: values.receiptUrl.trim() } : {}),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      },
    });
  };

  const handleApproveConfirm = () => {
    if (!approveExpenseTarget) return;
    // Backend approve endpoint accepts no body ({})
    approveMutation.mutate(
      {
        id: approveExpenseTarget.id || approveExpenseTarget._id,
        data: {},
      },
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
      label: "Disbursement / Vendor",
      render: (val, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
            {val}
          </Typography>
          <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
            Vendor: {row.vendorName || "Service Provider"} • {CATEGORY_LABELS[row.category] || row.category}
          </Typography>
        </Box>
      ),
    },
    {
      id: "building",
      label: "Complex",
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
          {row.building?.name || "Greenwood Valley"}
        </Typography>
      ),
    },
    {
      id: "amount",
      label: "Expense Amount",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
          {formatCurrency(val || 0)}
        </Typography>
      ),
    },
    {
      id: "expenseDate",
      label: "Incurred Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      id: "status",
      label: "Approval Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedExpense(row)}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: DESIGN_TOKENS.line[200],
              color: DESIGN_TOKENS.brand[600],
              "&:hover": { borderColor: DESIGN_TOKENS.brand[600], bgcolor: DESIGN_TOKENS.brand[50] },
            }}
          >
            Voucher
          </Button>

          {row.status === "PENDING_APPROVAL" && (
            <PermissionGuard permission={PERMISSIONS.EXPENSE_APPROVE}>
              <Button
                size="small"
                variant="contained"
                onClick={() => setApproveExpenseTarget(row)}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  bgcolor: "#16A34A",
                  "&:hover": { bgcolor: "#15803D" },
                  textTransform: "none",
                }}
              >
                Approve
              </Button>
            </PermissionGuard>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Society Operating Expenses"
        subtitle="Vendor disbursements, maintenance service contracts, utility charges, and audit approvals"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Expenses" }]}
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

            <PermissionGuard permission={PERMISSIONS.EXPENSE_CREATE}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                Record Expense
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
                Total Operational Outflow
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : formatCurrency(totalExpenditure)}
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
                bgcolor: "#FFFBEB",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PendingActionsIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 600, textTransform: "uppercase" }}>
                Pending Executive Approval
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : formatCurrency(pendingApprovalAmount)}
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
                Approved & Paid Items
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: DESIGN_TOKENS.text.primary, lineHeight: 1.2 }}>
                {isLoading ? "..." : approvedCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expenses by title, vendor, or category..."
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
          setStatusFilter("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || categoryFilter || statusFilter || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Expense Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Expense Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Approval Status</InputLabel>
          <Select
            value={statusFilter}
            label="Approval Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
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
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="No operational expenses logged"
          description="Record an operational disbursement or adjust active filter criteria."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Record First Expense
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        <Grid container spacing={3}>
          {filteredExpenses.map((exp) => {
            const expId = exp.id || exp._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={expId}>
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
                        label={CATEGORY_LABELS[exp.category] || exp.category}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: DESIGN_TOKENS.brand[50],
                          color: DESIGN_TOKENS.brand[600],
                        }}
                      />
                      <StatusChip status={exp.status} />
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: DESIGN_TOKENS.text.primary, mb: 0.5 }}>
                      {formatCurrency(exp.amount || 0)}
                    </Typography>

                    <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: DESIGN_TOKENS.text.primary, mb: 0.25 }}>
                      {exp.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 2 }}>
                      Vendor: {exp.vendorName || "Provider"}
                    </Typography>

                    <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${DESIGN_TOKENS.line[200]}`, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                        Incurred For Complex
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                        {exp.building?.name || "Greenwood Valley Residences"}
                      </Typography>
                    </Box>

                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                      Date: {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`, mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedExpense(exp)}
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
                      Voucher
                    </Button>

                    {exp.status === "PENDING_APPROVAL" && (
                      <PermissionGuard permission={PERMISSIONS.EXPENSE_APPROVE}>
                        <Button
                          variant="contained"
                          onClick={() => setApproveExpenseTarget(exp)}
                          sx={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            bgcolor: "#16A34A",
                            "&:hover": { bgcolor: "#15803D" },
                            textTransform: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Approve
                        </Button>
                      </PermissionGuard>
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
          rows={filteredExpenses}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedExpense(row)}
        />
      )}

      {/* Record Expense Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Record Society Operating Expense
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {createMutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {createMutation.error?.response?.data?.message || "Failed to record expense."}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(errors.category)}>
                  <InputLabel>Operational Category</InputLabel>
                  <Select label="Operational Category" defaultValue="UTILITIES" {...register("category")}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat] || cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Expense Title / Description"
                  placeholder="e.g. Monthly Central Lift Generator Diesel Refill"
                  size="small"
                  fullWidth
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                  {...register("title")}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Vendor / Payee Name"
                  placeholder="e.g. Shell Oil Depot"
                  size="small"
                  fullWidth
                  error={Boolean(errors.vendorName)}
                  helperText={errors.vendorName?.message}
                  {...register("vendorName")}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Disbursement Amount (PKR)"
                  type="number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  {...register("amount")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expense Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.expenseDate)}
                  helperText={errors.expenseDate?.message}
                  {...register("expenseDate")}
                />
              </Grid>
            </Grid>

            <TextField
              label="Receipt / Bill Scan URL (Optional)"
              placeholder="https://res.cloudinary.com/..."
              size="small"
              fullWidth
              error={Boolean(errors.receiptUrl)}
              helperText={errors.receiptUrl?.message}
              {...register("receiptUrl")}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
            <Button onClick={() => setIsCreateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                fontWeight: 600,
              }}
            >
              {createMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Approve Confirmation */}
      <ConfirmDialog
        open={Boolean(approveExpenseTarget)}
        title="Approve Operational Disbursement"
        description={`Are you sure you want to approve '${approveExpenseTarget?.title}' for ${formatCurrency(approveExpenseTarget?.amount || 0)} payable to ${approveExpenseTarget?.vendorName}?`}
        confirmLabel="Approve Disbursement"
        confirmColor="primary"
        isLoading={approveMutation.isPending}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveExpenseTarget(null)}
      />

      {/* Expense Voucher Inspection Modal */}
      <Dialog
        open={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 700 }}>
              <ReceiptIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: DESIGN_TOKENS.text.primary }}>
                Expense Voucher #{selectedExpense?.id?.slice(-8).toUpperCase() || "EXP"}
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {CATEGORY_LABELS[selectedExpense?.category] || selectedExpense?.category}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, textTransform: "uppercase", fontWeight: 700 }}>
                Disbursement Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: DESIGN_TOKENS.text.primary }}>
                {formatCurrency(selectedExpense?.amount || 0)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StatusChip status={selectedExpense?.status} />
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Payee / Vendor Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                    {selectedExpense?.vendorName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Complex
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    {selectedExpense?.building?.name || "Greenwood Valley"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Date Incurred
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.primary }}>
                    {selectedExpense?.expenseDate ? new Date(selectedExpense.expenseDate).toLocaleDateString() : "-"}
                  </Typography>
                </Grid>
              </Grid>

              {selectedExpense?.receiptUrl && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    href={selectedExpense.receiptUrl}
                    target="_blank"
                    sx={{ textTransform: "none", fontSize: "0.75rem" }}
                  >
                    View Uploaded Receipt Document
                  </Button>
                </Box>
              )}
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
          <Button
            onClick={() => setSelectedExpense(null)}
            variant="contained"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Close Voucher
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesListPage;
