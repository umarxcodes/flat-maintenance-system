// =====================  AUDIT LOGS & EVENT TRAIL  ============
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
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "STATUS_CHANGE", "ASSIGN"];

export const AuditLogsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(actionFilter && { action: actionFilter }),
  };

  const { data, isLoading } = useAuditLogsList(queryParams);
  const logs = data?.logs || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || logs.length;

  const columns = [
    {
      id: "createdAt",
      label: "Timestamp",
      render: (val) => (val ? new Date(val).toLocaleString() : "-"),
    },
    {
      id: "actor",
      label: "Actor / User",
      render: (_, row) =>
        row.actor ? `${row.actor.firstName || ""} ${row.actor.lastName || ""} (${row.actor.email || "User"})` : "System / Job",
    },
    {
      id: "action",
      label: "Action",
      render: (val) => <Chip label={val} size="small" variant="filled" color="primary" />,
    },
    {
      id: "resourceType",
      label: "Resource Domain",
      render: (val, row) => `${val} (${row.resourceId ? String(row.resourceId).slice(-6) : "-"})`,
    },
    {
      id: "ipAddress",
      label: "IP Address",
      render: (val) => val || "127.0.0.1",
    },
    {
      id: "actions",
      label: "State Inspection",
      align: "right",
      render: (_, row) => (
        <Tooltip title="Inspect State Diff">
          <IconButton
            size="small"
            color="primary"
            onClick={() => setSelectedLog(row)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Logs & Compliance Trail"
        subtitle="Immutable append-only chronological log of security events and state transitions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audit Logs" },
        ]}
      />

      <FilterBar
        onReset={() => {
          setActionFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(actionFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={actionFilter}
            label="Action"
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Actions</em>
            </MenuItem>
            {ACTIONS.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={logs}
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

      {/* Before / After State Inspector Dialog */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Security Audit Event Details: {selectedLog?.action} ({selectedLog?.resourceType})
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Actor Identity:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedLog?.actor?.firstName} {selectedLog?.actor?.lastName} ({selectedLog?.actor?.email})
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Timestamp:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toISOString() : "-"}
              </Typography>
            </Box>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Before State Snapshot
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "action.hover",
                    maxHeight: 280,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {selectedLog?.beforeState
                      ? JSON.stringify(selectedLog.beforeState, null, 2)
                      : "null (Initial Record Creation)"}
                  </pre>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  After State Snapshot
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "action.hover",
                    maxHeight: 280,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {selectedLog?.afterState
                      ? JSON.stringify(selectedLog.afterState, null, 2)
                      : "null (Record Deleted)"}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setSelectedLog(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogsListPage;
