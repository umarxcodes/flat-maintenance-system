import React, { useState, useId } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { DESIGN_TOKENS } from "../../theme/palette.js";

/**
 * Restrained, minimal TrendChart component per Section 6 & Appendix §A.5:
 * - Single thin line (~2px) in accent.blue or accent.green
 * - Minimal or no gridlines, no legend clutter
 * - Subtle gradient area fill
 * - Designed to sit in a card beside StatCard metrics
 */
export const TrendChart = ({
  title,
  subtitle,
  data = [45, 52, 58, 65, 60, 72, 78, 85],
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  color = DESIGN_TOKENS.accent.blue, // #3B82F6
  metric = null,
  emptyMessage = "No payments recorded yet this period",
  height = 140,
  sx = {},
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Normalize data to SVG coordinates
  const values = data.map((d) => (typeof d === "number" ? d : (d.value ?? 0)));
  const isZeroOrEmpty = values.length === 0 || values.every((v) => v === 0);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 100);
  const range = maxVal - minVal || 1;

  const width = 400;
  const paddingY = 16;
  const chartHeight = height - paddingY * 2;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1 || 1)) * width;
    const y = chartHeight - ((val - minVal) / range) * chartHeight + paddingY;
    return { x, y, val, label: labels[idx] || `Point ${idx + 1}` };
  });

  const linePath =
    points.length > 0
      ? points.reduce((acc, pt, idx) => {
          return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
        }, "")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
      : "";

  const uniqueId = useId().replace(/:/g, "");
  const gradientId = `trend-gradient-${uniqueId}`;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid",
        borderColor: DESIGN_TOKENS.line[200],
        borderRadius: "12px",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: DESIGN_TOKENS.line[300],
          boxShadow: "0 4px 14px -2px rgba(15, 23, 42, 0.06)",
        },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3, pb: 2, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            {title && (
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1.125rem", // 18px per hierarchy spec
                  fontWeight: 600,
                  color: DESIGN_TOKENS.text.primary,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.875rem", // 14px body/description text
                  fontWeight: 400,
                  color: DESIGN_TOKENS.text.secondary,
                  display: "block",
                  mt: 0.25,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {metric && (
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontWeight: 700,
                color,
                fontSize: "1.125rem",
                letterSpacing: "-0.01em",
              }}
            >
              {metric}
            </Typography>
          )}
        </Box>

        {/* Empty state when zero / no data instead of a flat error line */}
        {isZeroOrEmpty ? (
          <Box
            sx={{
              width: "100%",
              height,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: DESIGN_TOKENS.surface[50],
              borderRadius: "8px",
              border: "1px dashed",
              borderColor: DESIGN_TOKENS.line[200],
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontWeight: 500,
                color: DESIGN_TOKENS.text.secondary,
                fontSize: "0.8125rem",
              }}
            >
              {emptyMessage}
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                color: DESIGN_TOKENS.text.disabled || "#94A3B8",
                fontSize: "0.75rem",
                mt: 0.5,
              }}
            >
              Trend line will populate as payments are confirmed
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height, position: "relative", overflow: "hidden" }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              {/* Faint single baseline */}
              <line
                x1="0"
                y1={height - 2}
                x2={width}
                y2={height - 2}
                stroke={DESIGN_TOKENS.line[200]}
                strokeWidth="1"
              />

              {/* Filled Area */}
              <path d={areaPath} fill={`url(#${gradientId})`} />

              {/* Trend Line (Clean 2px single color) */}
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points on hover */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  {hoverIndex === idx && (
                    <>
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={height}
                        stroke={color}
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity={0.5}
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="5"
                        fill={color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    </>
                  )}
                  {/* Invisible hover area */}
                  <rect
                    x={pt.x - width / points.length / 2}
                    y={0}
                    width={width / points.length}
                    height={height}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoverIndex !== null && points[hoverIndex] && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  left: `${(points[hoverIndex].x / width) * 100}%`,
                  transform: "translateX(-50%)",
                  bgcolor: DESIGN_TOKENS.brand[900],
                  color: "#FFFFFF",
                  px: 1,
                  py: 0.25,
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  zIndex: 2,
                }}
              >
                {points[hoverIndex].label}: {points[hoverIndex].val}
              </Box>
            )}
          </Box>
        )}

        {/* Minimal X-axis labels (first & last) */}
        {!isZeroOrEmpty && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
              {labels[0]}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
              {labels[labels.length - 1]}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
