// =====================  STAT CARD COMPONENT (SUPER-CLEAN FIGMA SPEC)  =================
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

/**
 * Super-clean StatCard matching modern SaaS standards (Linear, Stripe, Figma reference):
 * - Generous 24px padding with pure white surface and 1px hairline border (#E2E8F0)
 * - 28-32px bold Inter numeral (-0.03em tracking)
 * - Optional icon container with subtle pastel tint for visual distinction
 * - Restrained, readable secondary metadata
 * - Smooth micro-hover elevation without jarring colored bars
 */
export const StatCard = ({
  value,
  label,
  delta,
  icon = null,
  isHero = false,
  action = null,
  sx = {},
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid",
        borderColor: isHero ? "rgba(67, 56, 202, 0.25)" : DESIGN_TOKENS.line[200],
        borderRadius: "12px",
        backgroundColor: "#FFFFFF",
        boxShadow: isHero
          ? "0 1px 3px rgba(67, 56, 202, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)"
          : "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.line[300],
          boxShadow: "0 4px 14px -2px rgba(15, 23, 42, 0.06)",
          transform: "translateY(-1px)",
        },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.25,
          }}
        >
          <Box sx={{ minWidth: 0, pr: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: FONT_UI,
                fontWeight: 500,
                color: DESIGN_TOKENS.text.secondary,
                fontSize: "0.8125rem", // 13px per spec
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.75rem", // 28px per spec
                lineHeight: 1.2,
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
                letterSpacing: "-0.03em",
              }}
            >
              {value}
            </Typography>
          </Box>

          {icon ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: isHero ? "rgba(67, 56, 202, 0.08)" : DESIGN_TOKENS.surface[100],
                color: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.text.secondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 20, ...icon.props?.sx } })}
            </Box>
          ) : action ? (
            <Box>{action}</Box>
          ) : null}
        </Box>

        {/* Bottom: Contextual Delta / Meta */}
        {delta && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: FONT_UI,
              display: "block",
              mt: 1,
              color: DESIGN_TOKENS.text.secondary,
              fontSize: "0.875rem", // 14px per spec
              fontWeight: 400,
              lineHeight: 1.4,
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
