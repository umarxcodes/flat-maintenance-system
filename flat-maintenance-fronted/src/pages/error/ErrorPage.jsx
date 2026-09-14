// =====================  GLOBAL ERROR BOUNDARY PAGE (SECTION 9)  ===============
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { useNavigate, useRouteError } from "react-router-dom";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

/**
 * Calm, specific error state adhering to Section 9:
 * - Never shows raw database errors or stack traces to end users
 * - Provides clear recovery action buttons
 */
export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error?.status === 404
      ? "The requested operational resource could not be found."
      : "We couldn't load this information right now. Please try again or return to your overview.";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: DESIGN_TOKENS.surface[50],
        p: 3,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: "100%",
          p: { xs: 3.5, sm: 5 },
          borderRadius: "14px",
          borderColor: DESIGN_TOKENS.line[200],
          bgcolor: "#FFFFFF",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "12px",
            bgcolor: "#FEE2E2",
            color: DESIGN_TOKENS.danger[600],
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2.5,
          }}
        >
          <ReportProblemOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>

        <Typography
          variant="h2"
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1.375rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.015em",
            mb: 1,
          }}
        >
          Notice
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: DESIGN_TOKENS.text.secondary,
            lineHeight: 1.6,
            mb: 3.5,
          }}
        >
          {errorMessage}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            startIcon={<ReplayRoundedIcon />}
            sx={{
              py: 1.1,
              px: 2.5,
              fontWeight: 600,
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
            startIcon={<HomeRoundedIcon />}
            sx={{
              py: 1.1,
              px: 2.5,
              fontWeight: 600,
              borderColor: DESIGN_TOKENS.line[200],
              color: DESIGN_TOKENS.text.primary,
              "&:hover": {
                borderColor: DESIGN_TOKENS.line[300],
                bgcolor: DESIGN_TOKENS.surface[50],
              },
            }}
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ErrorPage;
