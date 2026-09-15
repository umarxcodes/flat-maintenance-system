// =====================  VISITOR PASS VERIFICATION TERMINAL  ==========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LogoutIcon from "@mui/icons-material/Logout";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { visitorsApi } from "../../features/visitors/api/visitors.api.js";
import {
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
} from "../../features/visitors/hooks/use-visitors.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";

export const VisitorVerifyPage = () => {
  const navigate = useNavigate();
  const [passCode, setPassCode] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const checkInMutation = useCheckInVisitorMutation();
  const checkOutMutation = useCheckOutVisitorMutation();

  const handleVerify = async (e) => {
    e?.preventDefault();
    const cleanCode = passCode.trim();
    if (!cleanCode) return;

    if (!/^\d{6}$/.test(cleanCode)) {
      setVerifyError("Passcode must be exactly 6 numeric digits.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");
    setActionSuccess("");
    setVerifiedPass(null);

    try {
      const response = await visitorsApi.verifyVisitorPass(cleanCode);
      const passData = response?.data?.visitor || response?.visitor || response?.data || response;
      setVerifiedPass(passData);
      setVerifyMessage(response?.message || "Passcode verified.");
      if (passData?.vehicleNumber) {
        setVehicleNumber(passData.vehicleNumber);
      } else {
        setVehicleNumber("");
      }
    } catch (err) {
      setVerifyError(err?.response?.data?.message || err?.message || "Invalid or expired visitor passcode.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = () => {
    if (!verifiedPass) return;
    const targetId = verifiedPass.id || verifiedPass._id;
    checkInMutation.mutate(
      { id: targetId, vehicleNumber },
      {
        onSuccess: (res) => {
          setActionSuccess("Gate arrival recorded. Visitor successfully CHECKED IN.");
          setVerifiedPass((prev) => ({
            ...prev,
            status: "CHECKED_IN",
            entryTimestamp: new Date().toISOString(),
            vehicleNumber: vehicleNumber || prev.vehicleNumber,
          }));
        },
        onError: (err) => {
          setVerifyError(err?.response?.data?.message || err?.message || "Failed to check in visitor.");
        },
      }
    );
  };

  const handleCheckOut = () => {
    if (!verifiedPass) return;
    const targetId = verifiedPass.id || verifiedPass._id;
    checkOutMutation.mutate(targetId, {
      onSuccess: () => {
        setActionSuccess("Gate departure recorded. Visitor successfully CHECKED OUT.");
        setVerifiedPass((prev) => ({
          ...prev,
          status: "CHECKED_OUT",
          exitTimestamp: new Date().toISOString(),
        }));
      },
      onError: (err) => {
        setVerifyError(err?.response?.data?.message || err?.message || "Failed to check out visitor.");
      },
    });
  };

  return (
    <Box sx={{ maxWidth: 840, mx: "auto", pb: 6 }}>
      <PageHeader
        title="Gate Security Verification Terminal"
        subtitle="Authenticate 6-digit digital visitor credentials and execute physical gate access events"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Visitors", href: "/visitors" },
          { label: "Verify Pass" },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/visitors")}
            sx={{ borderRadius: "10px" }}
          >
            Back to Visitor Log
          </Button>
        }
      />

      {/* Terminal Scanner Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          mb: 4,
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              bgcolor: "primary.lighter",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
            }}
          >
            <SecurityIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Digital Passcode Scanner
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Enter the 6-digit numeric pass code provided by the arriving guest or delivery courier
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleVerify}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="6-Digit Pass Code"
                placeholder="e.g. 492810"
                value={passCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPassCode(val);
                }}
                autoFocus
                inputProps={{
                  maxLength: 6,
                  style: {
                    letterSpacing: "0.4em",
                    fontFamily: "monospace",
                    fontSize: "1.35rem",
                    fontWeight: 700,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isVerifying || passCode.length < 6}
                startIcon={isVerifying ? <CircularProgress size={18} color="inherit" /> : <QrCodeScannerIcon />}
                sx={{
                  py: 1.6,
                  borderRadius: "10px",
                  fontWeight: 700,
                }}
              >
                {isVerifying ? "Verifying..." : "Verify Passcode"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {verifyError && (
          <Alert severity="error" sx={{ mt: 2.5, borderRadius: "10px" }}>
            {verifyError}
          </Alert>
        )}
        {actionSuccess && (
          <Alert severity="success" sx={{ mt: 2.5, borderRadius: "10px" }}>
            {actionSuccess}
          </Alert>
        )}
      </Paper>

      {/* Verified Gate Pass Details */}
      {verifiedPass && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "14px",
            border: "1.5px solid",
            borderColor:
              verifiedPass.status === "EXPECTED"
                ? "primary.main"
                : verifiedPass.status === "CHECKED_IN"
                ? "success.main"
                : "#E2E8F0",
            background: "#FFFFFF",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header Banner */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B132B" }}>
                  {verifiedPass.visitorName}
                </Typography>
                <Chip
                  label={verifiedPass.visitorType || "GUEST"}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, borderRadius: "6px" }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Gate Pass ID: {verifiedPass._id || verifiedPass.id}
              </Typography>
            </Box>
            <StatusChip status={verifiedPass.status} />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Grid Spec */}
          <Grid container spacing={3} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PersonIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Visitor Phone
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {verifiedPass.visitorPhone || "Not Provided"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <HomeIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Destination Unit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Flat {verifiedPass.flatId?.flatNumber || verifiedPass.flat?.flatNumber || verifiedPass.flatNumber || "Assigned Unit"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <GroupIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Party Size
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {verifiedPass.visitorCount || 1} Person(s)
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AccessTimeIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Expected Arrival
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {verifiedPass.expectedArrivalDate
                      ? new Date(verifiedPass.expectedArrivalDate).toLocaleString("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "-"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <DirectionsCarIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle License Plate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {verifiedPass.vehicleNumber || "None Recorded"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PhoneIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Host Contact
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {verifiedPass.hostUserId?.firstName
                      ? `${verifiedPass.hostUserId.firstName} ${verifiedPass.hostUserId.lastName || ""}`
                      : "Resident Host"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {/* Timestamps if recorded */}
          {(verifiedPass.entryTimestamp || verifiedPass.exitTimestamp) && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "10px",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <Grid container spacing={2}>
                {verifiedPass.entryTimestamp && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Entry Timestamp:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                      {new Date(verifiedPass.entryTimestamp).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {verifiedPass.exitTimestamp && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Exit Timestamp:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {new Date(verifiedPass.exitTimestamp).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Gate Officer Actions */}
          <Box sx={{ pt: 2, borderTop: "1px solid #F1F5F9" }}>
            {verifiedPass.status === "EXPECTED" && (
              <Stack spacing={2}>
                <TextField
                  label="Optional: Record Arriving Vehicle License Plate"
                  placeholder="e.g. ABC-1234"
                  size="small"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  sx={{ maxWidth: 400 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={handleCheckIn}
                  disabled={checkInMutation.isPending}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: "10px",
                    fontWeight: 700,
                  }}
                >
                  {checkInMutation.isPending ? "Recording Gate Entry..." : "Authorize & Record Gate Arrival (Check In)"}
                </Button>
              </Stack>
            )}

            {verifiedPass.status === "CHECKED_IN" && (
              <Button
                variant="contained"
                color="warning"
                size="large"
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending}
                startIcon={<LogoutIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: "10px",
                  fontWeight: 700,
                }}
              >
                {checkOutMutation.isPending ? "Recording Gate Exit..." : "Record Gate Departure (Check Out)"}
              </Button>
            )}

            {["CHECKED_OUT", "EXPIRED", "DENIED"].includes(verifiedPass.status) && (
              <Alert severity="info" sx={{ borderRadius: "10px" }}>
                This visitor pass is closed ({verifiedPass.status}). No further gate actions are permitted.
              </Alert>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default VisitorVerifyPage;

