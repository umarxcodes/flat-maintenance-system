// =====================  STAT CARD COMPONENT (APPENDIX §A.4)  =================
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

/**
 * Visual Specification from UI/UX Master Prompt Section 6:
 * - Bold numeral (28px / 700) in Inter
 * - Label beneath in text.secondary (14px / 600)
 * - White surface.0 card with line.200 border and subtle elevation
 * - Optional delta written in words beneath
 */
export const StatCard = ({ value, label, delta, isHero = false, action = null, sx = {} }) => {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid",
        borderColor: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.line[200],
        borderRadius: "12px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.line[300],
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
        },
        ...sx,
      }}
    >
      {isHero && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: DESIGN_TOKENS.brand[600],
          }}
        />
      )}

      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: { xs: "1.75rem", sm: "2rem" },
              lineHeight: 1.15,
              fontWeight: 700,
              color: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.text.primary,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </Typography>
          {action && <Box>{action}</Box>}
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontFamily: FONT_UI,
            fontWeight: 600,
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          {label}
        </Typography>

        {delta && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: FONT_UI,
              display: "block",
              mt: 0.75,
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            {delta}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
