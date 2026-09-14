// =====================  PAGE HEADER COMPONENT  ===============
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink } from "react-router-dom";

export const PageHeader = ({ title, subtitle, breadcrumbs = [], action = null }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: "text.disabled" }} />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography
                key={crumb.label}
                variant="caption"
                color="text.primary"
                sx={{ fontWeight: 600 }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.label}
                component={RouterLink}
                to={crumb.href || "#"}
                underline="hover"
                color="text.secondary"
                variant="caption"
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              lineHeight: { xs: 1.25, sm: 1.3 },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;
