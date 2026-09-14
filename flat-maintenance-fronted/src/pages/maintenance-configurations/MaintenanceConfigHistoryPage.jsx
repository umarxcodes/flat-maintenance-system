// =====================  CONFIG HISTORY PAGE  =================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMaintenanceConfigHistory } from "../../features/maintenance-configurations/hooks/use-maintenance-configurations.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { formatCurrency } from "../../utils/format-currency.js";

const DESIGN_TOKENS = {
  brand: { 600: "#4F46E5", 700: "#4338CA", 50: "#EEF2FF" },
  text: { primary: "#0F172A", secondary: "#64748B" },
  line: { 200: "#E2E8F0" },
};

export const MaintenanceConfigHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryBuildingId = searchParams.get("buildingId");
  const activeBuildingId = queryBuildingId || buildings[0]?.id || buildings[0]?._id || "";

  const { data, isLoading } = useMaintenanceConfigHistory(activeBuildingId);
  const configs = data?.history || (Array.isArray(data) ? data : []);

  const selectedBuilding = buildings.find((b) => (b.id || b._id) === activeBuildingId);

  const columns = [
    {
      id: "effectiveFrom",
      label: "Effective From",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      id: "chargeType",
      label: "Formula Strategy",
      render: (val) => (val === "FLAT_RATE" ? "Fixed Flat Rate" : "Per Square Foot"),
    },
    {
      id: "baseRate",
      label: "Base Rate",
      render: (val) => formatCurrency(val || 0),
    },
    {
      id: "parkingCharge",
      label: "Parking Bay",
      render: (val) => formatCurrency(val || 0),
    },
    {
      id: "waterCharge",
      label: "Water Levy",
      render: (val) => formatCurrency(val || 0),
    },
    {
      id: "sinkingFundCharge",
      label: "Sinking Fund",
      render: (val) => formatCurrency(val || 0),
    },
    {
      id: "gracePeriodDays",
      label: "Grace Period",
      render: (val) => `${val || 0} Days`,
    },
    {
      id: "lateFeePercentage",
      label: "Late Fee Penalty",
      render: (val) => `${val || 0}%`,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Historical Billing Rate Formulas"
        subtitle={`Historical maintenance rate formulas and fee schedules for ${selectedBuilding?.name || "Selected Complex"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configurations", href: "/maintenance-configurations" },
          { label: "Audit History" },
        ]}
        action={
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 200, bgcolor: "#FFFFFF" }}>
              <InputLabel>Building Complex</InputLabel>
              <Select
                value={activeBuildingId}
                label="Building Complex"
                onChange={(e) => setSearchParams({ buildingId: e.target.value })}
              >
                {buildings.map((b) => (
                  <MenuItem key={b.id || b._id} value={b.id || b._id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/maintenance-configurations")}
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Active Formula
            </Button>
          </Box>
        }
      />

      <DataTable columns={columns} rows={configs} isLoading={isLoading} />
    </Box>
  );
};

export default MaintenanceConfigHistoryPage;
