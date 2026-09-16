// =====================  SCROLL PROGRESS BAR  =====================
import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Box from "@mui/material/Box";
import { DESIGN_TOKENS } from "../../../theme/palette.js";

/**
 * Subtle 2.5px viewport-top progress bar indicating page scroll depth.
 */
export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 1400,
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          scaleX,
          transformOrigin: "0%",
          width: "100%",
          height: "100%",
          background: `linear-gradient(90deg, ${DESIGN_TOKENS.brand[600]} 0%, #818CF8 50%, #06B6D4 100%)`,
        }}
      />
    </Box>
  );
};

export default ScrollProgressBar;
