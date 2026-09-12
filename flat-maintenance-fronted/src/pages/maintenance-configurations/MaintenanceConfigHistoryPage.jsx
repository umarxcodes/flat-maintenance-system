// =====================  CONFIG HISTORY PAGE  =================
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMaintenanceConfigHistory } from "../../features/maintenance-configurations/hooks/use-maintenance-configurations.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";

export const MaintenanceConfigHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get("buildingId") || "";
  const navigate = useNavigate();

  const { data, isLoading } = useMaintenanceConfigHistory(buildingId);
  const configs = data?.history || (Array.isArray(data) ? data : []);

  const columns = [
    {
      id: "effectiveFrom",
      label: "Effective From",
      render: (val) => (val ? val.slice(0, 10) : "-"),
    },
    {
      id: "chargeType",
      label: "Charge Strategy",
      render: (val) => (val === "FLAT_RATE" ? "Fixed Flat Rate" : "Per Square Foot"),
    },
    {
      id: "baseRate",
      label: "Base Rate ($)",
      render: (val) => `$${val?.toLocaleString() || "-"}`,
    },
    {
      id: "parkingCharge",
      label: "Parking ($)",
      render: (val) => `$${val?.toLocaleString() || "0"}`,
    },
    {
      id: "waterCharge",
      label: "Water ($)",
      render: (val) => `$${val?.toLocaleString() || "0"}`,
    },
    {
      id: "sinkingFundCharge",
      label: "Sinking Fund ($)",
      render: (val) => `$${val?.toLocaleString() || "0"}`,
    },
    {
      id: "lateFeePercentage",
      label: "Late Fee (%)",
      render: (val) => `${val}%`,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Historical Billing Configurations"
        subtitle={`Historical maintenance rate formulas for Complex ${buildingId}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configurations", href: "/maintenance-configurations" },
          { label: "History" },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/maintenance-configurations")}
          >
            Back to Configurations
          </Button>
        }
      />

      <DataTable columns={columns} rows={configs} isLoading={isLoading} />
    </Box>
  );
};

export default MaintenanceConfigHistoryPage;
