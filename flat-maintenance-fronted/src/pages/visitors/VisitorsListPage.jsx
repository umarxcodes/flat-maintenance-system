// =====================  VISITORS REGISTER LIST PAGE  ==========
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
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useVisitorsList,
  useCreateVisitorPassMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
} from "../../features/visitors/hooks/use-visitors.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const VISITOR_TYPES = ["GUEST", "DELIVERY", "CAB", "SERVICE_TECHNICIAN", "OTHER"];

const visitorPassSchema = z.object({
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().min(1, "Flat ID is required"),
  visitorName: z.string().min(1, "Visitor name is required"),
  visitorPhone: z.string().min(1, "Visitor phone is required"),
  visitorType: z.enum(["GUEST", "DELIVERY", "CAB", "SERVICE_TECHNICIAN", "OTHER"]),
  purpose: z.string().min(1, "Purpose of visit is required"),
  expectedArrival: z.string().min(1, "Expected arrival is required"),
});

export const VisitorsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [isPassOpen, setIsPassOpen] = useState(false);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useVisitorsList(queryParams);
  const createPassMutation = useCreateVisitorPassMutation();
  const checkInMutation = useCheckInVisitorMutation();
  const checkOutMutation = useCheckOutVisitorMutation();

  const visitors = data?.visitors || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || visitors.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(visitorPassSchema),
    defaultValues: {
      buildingId: "",
      flatId: "",
      visitorName: "",
      visitorPhone: "",
      visitorType: "GUEST",
      purpose: "Personal Visit",
      expectedArrival: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = (values) => {
    createPassMutation.mutate(values, {
      onSuccess: () => {
        setIsPassOpen(false);
        reset();
      },
    });
  };

  const columns = [
    {
      id: "visitorName",
      label: "Visitor Name",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.visitorPhone} • Flat {row.flat?.flatNumber || "Unit"}
          </Box>
        </Box>
      ),
    },
    {
      id: "passCode",
      label: "Gate Pass Code",
      render: (val) => (
        <Chip
          label={val || "PASS-XXXX"}
          color="primary"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontWeight: 700 }}
        />
      ),
    },
    {
      id: "visitorType",
      label: "Category",
      render: (val) => <Chip label={val} size="small" variant="filled" />,
    },
    {
      id: "expectedArrival",
      label: "Expected Arrival",
      render: (val) => (val ? new Date(val).toLocaleString() : "-"),
    },
    {
      id: "status",
      label: "Gate Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Security Actions",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY}>
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {row.status === "EXPECTED" && (
              <Tooltip title="Gate Check-In">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => checkInMutation.mutate(row.id || row._id)}
                >
                  <LoginIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {row.status === "CHECKED_IN" && (
              <Tooltip title="Gate Check-Out">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => checkOutMutation.mutate(row.id || row._id)}
                >
                  <LogoutIcon fontSize="small" />
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
        title="Visitor Gate Management"
        subtitle="Manage visitor passes, delivery entries, security check-in, and departure timestamps"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Visitors" }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY}>
              <Button
                component={RouterLink}
                to="/visitors/verify"
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
              >
                Verify Pass Code
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.VISITOR_CREATE}>
              <Button
                variant="contained"
                startIcon={<TransferWithinAStationIcon />}
                onClick={() => {
                  reset();
                  setIsPassOpen(true);
                }}
              >
                Pre-Generate Pass
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <FilterBar
        onReset={() => {
          setStatusFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(statusFilter)}
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
            {Object.values(STATUSES.VISITOR).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={visitors}
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

      {/* Generate Visitor Pass Modal */}
      <Dialog open={isPassOpen} onClose={() => setIsPassOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Pre-Generate Resident Visitor Pass</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createPassMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createPassMutation.error?.message || "Failed to generate visitor pass."}
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
                label="Destination Flat Unit ID"
                placeholder="Flat ObjectId"
                fullWidth
                error={Boolean(errors.flatId)}
                helperText={errors.flatId?.message}
                {...register("flatId")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Visitor Full Name"
                  fullWidth
                  error={Boolean(errors.visitorName)}
                  helperText={errors.visitorName?.message}
                  {...register("visitorName")}
                />

                <TextField
                  label="Visitor Phone"
                  fullWidth
                  error={Boolean(errors.visitorPhone)}
                  helperText={errors.visitorPhone?.message}
                  {...register("visitorPhone")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.visitorType)}>
                  <InputLabel>Visitor Type</InputLabel>
                  <Select label="Visitor Type" defaultValue="GUEST" {...register("visitorType")}>
                    {VISITOR_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Expected Arrival"
                  type="datetime-local"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.expectedArrival)}
                  helperText={errors.expectedArrival?.message}
                  {...register("expectedArrival")}
                />
              </Stack>

              <TextField
                label="Purpose of Visit"
                fullWidth
                error={Boolean(errors.purpose)}
                helperText={errors.purpose?.message}
                {...register("purpose")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsPassOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createPassMutation.isPending}>
              {createPassMutation.isPending ? "Generating..." : "Generate Pass"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default VisitorsListPage;
