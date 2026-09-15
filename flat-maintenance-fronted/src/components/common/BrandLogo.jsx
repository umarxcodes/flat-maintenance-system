// =====================  ENTERPRISE BRAND BUILDING LOGO  =============
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import { FONT_UI } from "../../theme/typography.js";

/**
 * World-Class Architectural Building Icon (Vector SVG)
 * Designed with precision isometric lines, gradient glass facades, and a radiant beacon crown.
 */
export const BuildingIcon = ({ size = 36, sx = {} }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        filter: "drop-shadow(0 4px 12px rgba(79, 70, 229, 0.35))",
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease",
        "&:hover": {
          transform: "scale(1.06) translateY(-1px)",
          filter: "drop-shadow(0 6px 18px rgba(99, 102, 241, 0.5))",
        },
        ...sx,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* Border Stroke Gradient */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
          </linearGradient>

          {/* Center Tower Primary Gradient */}
          <linearGradient id="centerTower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="60%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>

          {/* Left Tower Gradient */}
          <linearGradient id="leftTower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Right Tower Gradient */}
          <linearGradient id="rightTower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>

          {/* Golden Beacon / Sun Flare */}
          <linearGradient id="beaconGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Glass Reflection Accent */}
          <linearGradient id="glassReflect" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Foundation Shadow Filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Housing Container */}
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="17"
          fill="url(#bgGrad)"
          stroke="url(#borderGrad)"
          strokeWidth="1.5"
        />

        {/* Subtle Ambient Floor Grid / Foundation Line */}
        <path
          d="M10 50.5H54"
          stroke="#334155"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* ----------------- LEFT TOWER (RESIDENTIAL WING) ----------------- */}
        {/* Main Body */}
        <path
          d="M14 26L23 21V50H14V26Z"
          fill="url(#leftTower)"
          fillOpacity="0.9"
        />
        {/* Left Tower Roof Cap (Angled Penthouse) */}
        <path
          d="M14 26L23 21L23 20L14 25V26Z"
          fill="#BAE6FD"
        />
        {/* Windows / Balcony Slots (Left Tower) */}
        <line x1="17" y1="28" x2="20" y2="28" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="17" y1="33" x2="20" y2="33" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="17" y1="38" x2="20" y2="38" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="17" y1="43" x2="20" y2="43" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />

        {/* ----------------- RIGHT TOWER (EXECUTIVE SUITES) ----------------- */}
        {/* Main Body */}
        <path
          d="M41 29L50 24V50H41V29Z"
          fill="url(#rightTower)"
          fillOpacity="0.9"
        />
        {/* Right Tower Roof Cap */}
        <path
          d="M41 29L50 24L50 23L41 28V29Z"
          fill="#DDD6FE"
        />
        {/* Windows (Right Tower) */}
        <line x1="44" y1="31" x2="47" y2="31" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="44" y1="36" x2="47" y2="36" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="44" y1="41" x2="47" y2="41" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="44" y1="46" x2="47" y2="46" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" strokeLinecap="round" />

        {/* ----------------- CENTER MASTER TOWER (MAIN HEADQUARTERS) ----------------- */}
        {/* Main Monolith Body with Peak Roof */}
        <path
          d="M25 15L32 10L39 15V50H25V15Z"
          fill="url(#centerTower)"
        />

        {/* Glass Facade Left Reflection */}
        <path
          d="M25 15L32 10V50H25V15Z"
          fill="url(#glassReflect)"
        />

        {/* Center Vertical Architectural Spine */}
        <line
          x1="32"
          y1="10"
          x2="32"
          y2="50"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeOpacity="0.35"
        />

        {/* Master Center Tower Windows (Grid Pattern) */}
        {/* Row 1 */}
        <rect x="27.5" y="19" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="33.5" y="19" width="3" height="2.5" rx="0.5" fill="#38BDF8" fillOpacity="0.9" />
        {/* Row 2 */}
        <rect x="27.5" y="24" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="33.5" y="24" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        {/* Row 3 */}
        <rect x="27.5" y="29" width="3" height="2.5" rx="0.5" fill="#38BDF8" fillOpacity="0.9" />
        <rect x="33.5" y="29" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        {/* Row 4 */}
        <rect x="27.5" y="34" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="33.5" y="34" width="3" height="2.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />

        {/* Grand Portico / Entrance Atrium */}
        <path
          d="M29.5 42H34.5V50H29.5V42Z"
          fill="#0B132B"
        />
        <path
          d="M30.5 44H33.5V50H30.5V44Z"
          fill="#38BDF8"
          fillOpacity="0.8"
        />

        {/* ----------------- SMART CROWN BEACON / SATELLITE SPIRE ----------------- */}
        <line x1="32" y1="10" x2="32" y2="6.5" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="5.5" r="2" fill="url(#beaconGlow)" filter="url(#softGlow)" />
        <circle cx="32" cy="5.5" r="0.8" fill="#FFFFFF" />

        {/* Ambient Signal Waves (Pulse) */}
        <path
          d="M27 6C28.2 4.8 30 4 32 4C34 4 35.8 4.8 37 6"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </svg>
    </Box>
  );
};

/**
 * Enterprise Brand Logo Component
 * Combines the precision architectural icon with high-contrast, perfectly tracked typography.
 *
 * @param {Object} props
 * @param {'full'|'compact'|'icon'} [props.variant='full']
 * @param {'dark'|'light'} [props.theme='dark']
 * @param {number} [props.size=38]
 * @param {string} [props.title='Flat Maintenance']
 * @param {string} [props.subtitle='Residential Operations']
 * @param {string} [props.href='/dashboard']
 * @param {Object} [props.sx={}]
 */
export const BrandLogo = ({
  variant = "full",
  theme = "dark",
  size = 38,
  title = "Flat Maintenance",
  subtitle = "Residential Operations",
  href = "/dashboard",
  sx = {},
}) => {
  const isDark = theme === "dark";

  const content = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        textDecoration: "none",
        color: "inherit",
        userSelect: "none",
        ...sx,
      }}
    >
      <BuildingIcon size={size} />

      {variant !== "icon" && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: size >= 42 ? "1.25rem" : "1.0625rem",
              fontWeight: 800,
              lineHeight: 1.15,
              color: isDark ? "#FFFFFF" : "#0F172A",
              letterSpacing: "-0.025em",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
          >
            <span>Flat</span>
            <Box
              component="span"
              sx={{
                background: isDark
                  ? "linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)"
                  : "linear-gradient(135deg, #4F46E5 0%, #0284C7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
              }}
            >
              Maintenance
            </Box>
          </Typography>

          {variant === "full" && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: isDark ? "#94A3B8" : "#64748B",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1.3,
                mt: 0.25,
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  if (href) {
    return (
      <RouterLink to={href} style={{ textDecoration: "none", color: "inherit", display: "inline-flex" }}>
        {content}
      </RouterLink>
    );
  }

  return content;
};

BuildingIcon.propTypes = {
  size: PropTypes.number,
  sx: PropTypes.object,
};

BrandLogo.propTypes = {
  variant: PropTypes.oneOf(["full", "compact", "icon"]),
  theme: PropTypes.oneOf(["dark", "light"]),
  size: PropTypes.number,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  href: PropTypes.string,
  sx: PropTypes.object,
};

export default BrandLogo;
