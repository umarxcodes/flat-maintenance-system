// =====================  VISITOR PASS VERIFICATION  ==========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { visitorsApi } from "../../features/visitors/api/visitors.api.js";
import { useCheckInVisitorMutation } from "../../features/visitors/hooks/use-visitors.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";

export const VisitorVerifyPage = () => {
  const navigate = useNavigate();
  const [passCode, setPassCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const checkInMutation = useCheckInVisitorMutation();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!passCode) return;

    setIsVerifying(true);
    setVerifyError("");
    setVerifiedPass(null);

    try {
      const result = await visitorsApi.verifyVisitorPass(passCode.trim());
      setVerifiedPass(result?.visitor || result);
    } catch (err) {
      setVerifyError(err?.message || "Invalid or expired visitor pass code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = () => {
    if (!verifiedPass) return;
    checkInMutation.mutate(verifiedPass.id || verifiedPass._id, {
      onSuccess: () => {
        setVerifiedPass((prev) => ({ ...prev, status: "CHECKED_IN" }));
      },
    });
  };

  return (
    <Box>
      <PageHeader
        title="Gate Pass Code Verification"
        subtitle="Validate digital gate entry credentials and record physical visitor arrival"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Visitors", href: "/visitors" },
          { label: "Verify Pass" },
        ]}
        action={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/visitors")}>
            Back to Visitor Log
          </Button>
        }
      />

      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Paper variant="outlined" sx={{ p: 4, mb: 3 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
            <QrCodeScannerIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Verify Visitor Credentials
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleVerify}>
            <Stack spacing={2}>
              <TextField
                label="Enter 8-Digit Pass Code"
                placeholder="e.g. PASS-891278"
                fullWidth
                value={passCode}
                onChange={(e) => setPassCode(e.target.value)}
                autoFocus
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isVerifying || !passCode}
                startIcon={isVerifying ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {isVerifying ? "Verifying..." : "Verify Pass Code"}
              </Button>
            </Stack>
          </Box>

          {verifyError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {verifyError}
            </Alert>
          )}
        </Paper>

        {/* Verification Result Card */}
        {verifiedPass && (
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderColor: verifiedPass.status === "EXPECTED" ? "success.main" : "divider",
              borderWidth: 2,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {verifiedPass.visitorName}
              </Typography>
              <StatusChip status={verifiedPass.status} />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Contact Phone
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {verifiedPass.visitorPhone || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Destination Unit
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Flat {verifiedPass.flat?.flatNumber || verifiedPass.flatId}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Purpose of Visit
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {verifiedPass.purpose || "Personal"}
                </Typography>
              </Box>
            </Stack>

            {verifiedPass.status === "EXPECTED" ? (
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                startIcon={<CheckCircleIcon />}
              >
                {checkInMutation.isPending ? "Processing..." : "Confirm Gate Entry (Check In)"}
              </Button>
            ) : (
              <Alert severity="info">
                This visitor pass is currently marked as {verifiedPass.status}.
              </Alert>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default VisitorVerifyPage;
