// =====================  PROGRESS STEPPER COMPONENT (APPENDIX §A.4)  ============
import React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

/**
 * Custom Step Icon adhering to design tokens
 */
const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;

  let bg = DESIGN_TOKENS.paper[50];
  let color = DESIGN_TOKENS.text.secondary;
  let border = `1px solid ${DESIGN_TOKENS.line[200]}`;

  if (completed) {
    bg = DESIGN_TOKENS.evergreen[600];
    color = "#FFFFFF";
    border = `1px solid ${DESIGN_TOKENS.evergreen[600]}`;
  } else if (active) {
    bg = DESIGN_TOKENS.ink[900];
    color = "#FFFFFF";
    border = `1px solid ${DESIGN_TOKENS.ink[900]}`;
  }

  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        color: color,
        border: border,
        fontSize: "0.75rem",
        fontWeight: 600,
        fontFamily: FONT_UI,
        transition: "all 0.2s ease",
      }}
    >
      {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : icon}
    </Box>
  );
};

/**
 * Visual Specification from Appendix §A.4:
 * - Horizontal on desktop, vertical on mobile (Section 50/A.4)
 * - Reserved strictly for genuinely sequential state (work order lifecycle, visitor pass lifecycle, invoice lifecycle)
 * - Evergreen indicator for completed, Ink for active, warm hairline line.200 for connectors
 */
export const ProgressStepper = ({
  steps = [],
  activeStep = 0,
  orientation = null, // auto-selects if null
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chosenOrientation = orientation || (isMobile ? "vertical" : "horizontal");

  return (
    <Box sx={{ width: "100%", py: 2, ...sx }}>
      <Stepper
        activeStep={activeStep}
        orientation={chosenOrientation}
        sx={{
          "& .MuiStepConnector-line": {
            borderColor: DESIGN_TOKENS.line[200],
            borderWidth: "1.5px",
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label} completed={index < activeStep}>
            <StepLabel
              slots={{ stepIcon: CustomStepIcon }}
              slotProps={{
                label: {
                  sx: {
                    fontFamily: FONT_UI,
                    fontSize: "0.8125rem",
                    fontWeight: index === activeStep ? 600 : 500,
                    color: index === activeStep ? "text.primary" : "text.secondary",
                  },
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default ProgressStepper;
