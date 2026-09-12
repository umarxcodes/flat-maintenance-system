// =====================  SYSTEM ROLES LIST PAGE  ==============
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import ShieldIcon from "@mui/icons-material/Shield";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useRolesList } from "../../features/roles/hooks/use-roles.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { CardLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const RolesListPage = () => {
  const { data, isLoading } = useRolesList();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = data?.roles || (Array.isArray(data) ? data : []);

  return (
    <Box>
      <PageHeader
        title="System Roles & Authority"
        subtitle="Review platform roles, hierarchical privileges, and associated permission codes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Roles" },
        ]}
      />

      {isLoading ? (
        <CardLoadingSkeleton count={6} />
      ) : (
        <Grid container spacing={3}>
          {roles.map((role) => {
            const roleKey = role.id || role._id || role.code;
            const permissionsCount = role.permissions?.length || 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={roleKey}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: "primary.lighter",
                          color: "primary.main",
                          display: "flex",
                        }}
                      >
                        <ShieldIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {ROLE_LABELS[role.code] || role.name || role.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {role.code}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {role.description || "System authority role with predefined operational capabilities."}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Chip
                        label={`${permissionsCount} Permissions`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setSelectedRole(role)}
                      >
                        View Permissions
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Role Permissions Detail Dialog */}
      <Dialog
        open={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedRole ? ROLE_LABELS[selectedRole.code] || selectedRole.name : ""} Permissions
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedRole?.description}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }} display="block">
            Attached Granular Permission Tokens:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
            {selectedRole?.permissions?.map((perm) => (
              <Chip key={perm} label={perm} size="small" variant="filled" />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setSelectedRole(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesListPage;
