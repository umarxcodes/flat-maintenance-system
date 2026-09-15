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
  const resolvedBg = iconBg || (isHero ? "rgba(79, 70, 229, 0.08)" : "#EEF2FF");
  const resolvedColor =
    iconColor || (isHero ? DESIGN_TOKENS.brand[600] : DESIGN_TOKENS.brand[600]);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: isHero ? "rgba(79, 70, 229, 0.35)" : DESIGN_TOKENS.line[200],
        borderRadius: "14px",
        backgroundColor: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        boxShadow: isHero
          ? "0 1px 3px rgba(79, 70, 229, 0.08), 0 4px 12px rgba(79, 70, 229, 0.04)"
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
      {isHero && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: DESIGN_TOKENS.brand[600],
          }}
        />
      )}
      <CardContent
        sx={{
          p: { xs: 1.75, sm: 2 },
          "&:last-child": { pb: { xs: 1.75, sm: 2 } },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1.25,
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontWeight: 600,
                color: DESIGN_TOKENS.text.secondary,
                fontSize: "0.8125rem",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              {label}
            </Typography>

            {icon ? (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
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
                {React.cloneElement(icon, { sx: { fontSize: 18, ...icon.props?.sx } })}
              </Box>
            ) : action ? (
              <Box>{action}</Box>
            ) : null}
          </Box>

          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: { xs: "1.375rem", sm: "1.625rem" },
              lineHeight: 1.15,
              fontWeight: 700,
              color: DESIGN_TOKENS.text.primary,
              letterSpacing: "-0.025em",
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Bottom Contextual Indicator */}
        {delta && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 1,
              pt: 0.75,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: FONT_UI,
                color: DESIGN_TOKENS.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 500,
                lineHeight: 1.25,
              }}
            >
              {delta}
            </Typography>
          </Box>
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
