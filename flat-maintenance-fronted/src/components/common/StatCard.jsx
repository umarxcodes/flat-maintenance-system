// =====================  STAT CARD COMPONENT (SUPER-CLEAN FIGMA SPEC)  =================
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";
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
  iconBg = null,
  iconColor = null,
  isHero = false,
  action = null,
  sx = {},
}) => {
  const resolvedBg = iconBg || (isHero ? "rgba(67, 56, 202, 0.08)" : "#F1F5F9");
  const resolvedColor =
    iconColor || (isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.text.secondary);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid",
        borderColor: isHero ? "rgba(67, 56, 202, 0.25)" : DESIGN_TOKENS.line[200],
        borderRadius: "14px",
        backgroundColor: "#FFFFFF",
        boxShadow: isHero
          ? "0 1px 3px rgba(67, 56, 202, 0.08), 0 4px 12px rgba(67, 56, 202, 0.04)"
          : "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.brand[300],
          boxShadow:
            "0 10px 25px -5px rgba(15, 23, 42, 0.07), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
          transform: "translateY(-2px)",
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
            mb: 1.5,
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
                mb: 0.75,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.875rem", // 30px bold numeral
                lineHeight: 1.15,
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
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: resolvedBg,
                color: resolvedColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 22, ...icon.props?.sx } })}
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

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  delta: PropTypes.string,
  icon: PropTypes.node,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
  isHero: PropTypes.bool,
  action: PropTypes.node,
  sx: PropTypes.object,
};

export default StatCard;
