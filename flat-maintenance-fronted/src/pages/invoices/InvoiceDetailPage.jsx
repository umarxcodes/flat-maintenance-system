// =====================  INVOICE DETAIL PAGE  ==================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import PaymentIcon from "@mui/icons-material/Payment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceDetail } from "../../features/invoices/hooks/use-invoices.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { formatCurrency } from "../../utils/format-currency.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoiceDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  const lineItems = invoice?.lineItems || [];

  return (
    <Box>
      <PageHeader
        title={`Invoice Voucher #${invoice?.invoiceNumber || id.slice(-6).toUpperCase()}`}
        subtitle={`Billing Period: ${invoice?.billingPeriod || `${invoice?.billingMonth}/${invoice?.billingYear}`} • Flat ${invoice?.flat?.flatNumber || "Unit"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/invoices" },
          { label: "Voucher Breakdown" },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/invoices")}
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Back to Invoices
            </Button>
            {invoice?.dueAmount > 0 && invoice?.status !== "VOID" && (
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/payments?invoiceId=${id}`)}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Execute Payment
              </Button>
            )}
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              mb: 3,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: DESIGN_TOKENS.text.primary }}>
              Itemized Fee Breakdown
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                      Calculated Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.length > 0 ? (
                    lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: DESIGN_TOKENS.text.primary }}>
                          {item.description || item.name || `Maintenance Component ${index + 1}`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                          {formatCurrency(item.amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      <TableRow>
                        <TableCell>Base Maintenance Assessment</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatCurrency(invoice?.subTotal || invoice?.totalAmount || 0)}
                        </TableCell>
                      </TableRow>
                      {invoice?.lateFee > 0 && (
                        <TableRow>
                          <TableCell sx={{ color: "error.main" }}>Late Payment Surcharge</TableCell>
                          <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                            +{formatCurrency(invoice?.lateFee || 0)}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: DESIGN_TOKENS.text.primary }}>
              Voucher Ledger
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <StatusChip status={invoice?.status || "ISSUED"} />
              </Box>

              <Divider sx={{ borderColor: DESIGN_TOKENS.line[200] }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Total Assessment
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: DESIGN_TOKENS.text.primary }}>
                  {formatCurrency(invoice?.totalAmount || 0)}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Paid to Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#16A34A" }}>
                  {formatCurrency(invoice?.paidAmount || 0)}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Balance Outstanding
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: invoice?.dueAmount > 0 ? "error.main" : "success.main",
                  }}
                >
                  {formatCurrency(invoice?.dueAmount || 0)}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: DESIGN_TOKENS.line[200] }} />

              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                Payment Due: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDetailPage;
