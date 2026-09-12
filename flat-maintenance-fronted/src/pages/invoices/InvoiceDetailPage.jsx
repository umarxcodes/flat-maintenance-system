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
import PaymentIcon from "@mui/icons-material/Payment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceDetail } from "../../features/invoices/hooks/use-invoices.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

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
        title={`Invoice ${invoice?.invoiceNumber || id}`}
        subtitle={`Billing Period: ${invoice?.billingMonth}/${invoice?.billingYear} • Flat ${invoice?.flat?.flatNumber || "Unit"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/invoices" },
          { label: "Invoice Details" },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/invoices")}>
              Back to Invoices
            </Button>
            {invoice?.dueAmount > 0 && invoice?.status !== "VOID" && (
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/payments?invoiceId=${id}`)}
              >
                Make Payment
              </Button>
            )}
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3.5, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Itemized Billing Breakdown
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.length > 0 ? (
                    lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description || item.name || `Charge Component ${index + 1}`}</TableCell>
                        <TableCell align="right">${item.amount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      <TableRow>
                        <TableCell>Base Maintenance Charge</TableCell>
                        <TableCell align="right">${invoice?.subTotal?.toLocaleString() || "0"}</TableCell>
                      </TableRow>
                      {invoice?.lateFee > 0 && (
                        <TableRow>
                          <TableCell>Late Payment Penalty</TableCell>
                          <TableCell align="right" sx={{ color: "error.main" }}>
                            ${invoice?.lateFee?.toLocaleString()}
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
          <Paper variant="outlined" sx={{ p: 3.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Payment Summary
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={invoice?.status || "ISSUED"} />
              </Box>

              <Divider />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${invoice?.subTotal?.toLocaleString() || "0"}</Typography>
              </Box>

              {invoice?.lateFee > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="error.main">Late Fee</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                    +${invoice?.lateFee?.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Total Invoiced</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  ${invoice?.totalAmount?.toLocaleString() || "0"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                  ${invoice?.paidAmount?.toLocaleString() || "0"}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Outstanding Balance</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: invoice?.dueAmount > 0 ? "error.main" : "success.main" }}>
                  ${invoice?.dueAmount?.toLocaleString() || "0"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Due Date: {invoice?.dueDate ? invoice.dueDate.slice(0, 10) : "-"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDetailPage;
