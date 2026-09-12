// =====================  STAT CARD COMPONENT (APPENDIX §A.4)  =================
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FONT_DISPLAY, FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

/**
 * Visual Specification from Appendix §A.4:
 * - Large Fraunces numeral
 * - Inter label underneath
 * - Optional one-line delta written in words ("12 more than last month"), NEVER a sparkline or arrow icon.
 * - Optional brass tertiary highlight support if isHero=true (Appendix §A.1: at most one element per screen).
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
        borderColor: isHero ? DESIGN_TOKENS.brass[500] : "divider",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "background.paper",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: isHero ? DESIGN_TOKENS.brass[500] : "text.secondary",
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
            backgroundColor: DESIGN_TOKENS.brass[500],
          }}
        />
      )}

      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
        >
          <Typography
            sx={{
              fontFamily: FONT_DISPLAY,
              fontSize: { xs: "2rem", sm: "2.5rem" },
              lineHeight: 1.1,
              fontWeight: 500,
              color: isHero ? DESIGN_TOKENS.brass[500] : "text.primary",
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
              color: isHero ? DESIGN_TOKENS.brass[500] : "text.secondary",
              fontWeight: 400,
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
