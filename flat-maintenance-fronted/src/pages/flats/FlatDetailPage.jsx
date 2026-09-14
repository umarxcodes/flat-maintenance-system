// =====================  FLAT DETAIL PAGE  ====================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import { useParams, useNavigate } from "react-router-dom";
import {
  useFlatDetail,
  useUpdateFlatStatusMutation,
} from "../../features/flats/hooks/use-flats.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

export const FlatDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: flat, isLoading, refetch } = useFlatDetail(id);
  const updateStatusMutation = useUpdateFlatStatusMutation();

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  const handleOpenStatus = () => {
    setSelectedStatus(flat?.status || STATUSES.FLAT.VACANT);
    setIsStatusOpen(true);
  };

  const handleStatusSubmit = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate(
      { id, status: selectedStatus },
      {
        onSuccess: () => {
          setIsStatusOpen(false);
          refetch();
        },
      }
    );
  };

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title={`Flat Unit ${flat?.flatNumber || id}`}
        subtitle={`${flat?.flatType || "—"} • ${flat?.areaSqFt || "—"} Sq Ft • ID: ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Flats", href: "/flats" },
          { label: `Flat ${flat?.flatNumber || "Details"}` },
        ]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/flats")}
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                fontWeight: 600,
              }}
            >
              Back to Flats
            </Button>

            <PermissionGuard permission={PERMISSIONS.FLAT_UPDATE}>
              <Button
                variant="contained"
                startIcon={<EditLocationAltIcon />}
                onClick={handleOpenStatus}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Change Occupancy Status
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        {/* Unit Specifications Card */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#0F172A",
                mb: 2.5,
              }}
            >
              Unit Specifications
            </Typography>

            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    Flat / Unit Number
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#0F172A" }}>
                    Flat {flat?.flatNumber}
                  </Typography>
                </Box>
                <StatusChip status={flat?.status || STATUSES.FLAT.VACANT} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "#EEF2FF",
                    color: DESIGN_TOKENS.brand[600],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SquareFootOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    Area & Layout
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    {flat?.flatType || "2BHK"} • {flat?.areaSqFt || "—"} Square Feet
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  bgcolor: DESIGN_TOKENS.surface[50],
                  border: "1px solid #F1F5F9",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}
                >
                  Unit Registration Date
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {flat?.createdAt ? new Date(flat.createdAt).toLocaleDateString() : "Registered"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Location & Occupant Card */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#0F172A",
                mb: 2.5,
              }}
            >
              Location in Complex
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "#F1F5F9",
                    color: DESIGN_TOKENS.text.secondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ApartmentOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    Building Complex
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    {flat?.buildingId?.name || flat?.building?.name || "Residential Complex"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ pl: 6 }}>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Tower / Block
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {flat?.blockId?.name || flat?.block?.name || "Tower"}
                </Typography>
              </Box>

              <Box sx={{ pl: 6 }}>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Floor Level
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Level {flat?.floorId?.floorNumber ?? flat?.floor?.floorNumber ?? "—"}{" "}
                  {flat?.floorId?.name ? `(${flat.floorId.name})` : ""}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                Resident Allocation
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "#ECFDF5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PersonOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                    Current Owner / Landlord
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {flat?.currentOwnerId?.userId?.firstName || flat?.currentOwner?.firstName
                      ? `${flat.currentOwnerId?.userId?.firstName || flat.currentOwner?.firstName} ${flat.currentOwnerId?.userId?.lastName || flat.currentOwner?.lastName}`
                      : "No Owner Registered"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ pl: 6 }}>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Active Tenant Lease
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {flat?.currentTenantId?.userId?.firstName || flat?.currentTenant?.firstName
                    ? `${flat.currentTenantId?.userId?.firstName || flat.currentTenant?.firstName} ${flat.currentTenantId?.userId?.lastName || flat.currentTenant?.lastName}`
                    : "No Active Lease / Vacant"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Transition Dialog */}
      <Dialog open={isStatusOpen} onClose={() => setIsStatusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Update Occupancy Status
        </DialogTitle>
        <DialogContent dividers>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatusMutation.error?.message || "Failed to update status."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: DESIGN_TOKENS.text.secondary }}>
            Change operational occupancy status for Flat {flat?.flatNumber}:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {Object.values(STATUSES.FLAT).map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsStatusOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusSubmit}
            disabled={updateStatusMutation.isPending}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            {updateStatusMutation.isPending ? "Saving..." : "Confirm Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlatDetailPage;
