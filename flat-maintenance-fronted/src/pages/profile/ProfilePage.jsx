// =====================  MY PROFILE PAGE  =====================
import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../providers/auth-context.js";
import {
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useUpdateProfileMutation,
} from "../../features/users/hooks/use-users.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { DESIGN_TOKENS } from "../../theme/palette.js";

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || user?.phoneNumber || "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const uploadAvatarMutation = useUploadAvatarMutation();
  const deleteAvatarMutation = useDeleteAvatarMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: "File size exceeds 5MB. Please choose a smaller image.",
        severity: "error",
      });
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: "Invalid file format. Only JPEG, PNG, and WebP images are allowed.",
        severity: "error",
      });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);

    uploadAvatarMutation.mutate(payload, {
      onSuccess: (updatedUser) => {
        refreshUser(updatedUser);
        setSnackbar({
          open: true,
          message: "Profile picture uploaded to Cloudinary successfully!",
          severity: "success",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err?.response?.data?.message || "Failed to upload profile picture to Cloudinary.",
          severity: "error",
        });
      },
    });
  };

  const handleDeleteAvatar = () => {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: (updatedUser) => {
        refreshUser(updatedUser);
        setSnackbar({
          open: true,
          message: "Profile picture removed.",
          severity: "info",
        });
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err?.response?.data?.message || "Failed to remove profile picture.",
          severity: "error",
        });
      },
    });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData, {
      onSuccess: (updatedUser) => {
        refreshUser(updatedUser);
        setIsEditing(false);
        setSnackbar({
          open: true,
          message: "Account details updated successfully!",
          severity: "success",
        });
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err?.response?.data?.message || "Failed to update profile details.",
          severity: "error",
        });
      },
    });
  };

  const isUploading = uploadAvatarMutation.isPending || deleteAvatarMutation.isPending;

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal account credentials, Cloudinary profile avatar, and view complex assignment scope"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
      />

      <Grid container spacing={3}>
        {/* User Avatar & Identity Card */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            {/* Cloudinary Profile Picture Section */}
            <Box sx={{ position: "relative", width: 108, height: 108, mx: "auto", mb: 2 }}>
              <Avatar
                src={user?.avatarUrl || ""}
                alt={`${user?.firstName} ${user?.lastName}`}
                sx={{
                  width: 108,
                  height: 108,
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  bgcolor: DESIGN_TOKENS.brand[600],
                  border: `3px solid #FFFFFF`,
                  boxShadow: "0 8px 24px rgba(79, 70, 229, 0.25)",
                  transition: "opacity 0.2s ease",
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                {initials}
              </Avatar>

              {/* Uploading Overlay Spinner */}
              {isUploading && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    bgcolor: "rgba(15, 23, 42, 0.4)",
                  }}
                >
                  <CircularProgress size={36} sx={{ color: "#FFFFFF" }} />
                </Box>
              )}

              {/* Camera Upload Button Overlay */}
              <Tooltip title="Upload Photo to Cloudinary">
                <IconButton
                  size="small"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: DESIGN_TOKENS.brand[600],
                    color: "#FFFFFF",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    border: "2px solid #FFFFFF",
                    "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </Box>

            {/* Avatar Action Buttons */}
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={handleAvatarClick}
                disabled={isUploading}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderColor: DESIGN_TOKENS.line[200],
                  color: DESIGN_TOKENS.text.primary,
                }}
              >
                Upload Photo
              </Button>

              {user?.avatarUrl && (
                <Tooltip title="Remove photo">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                    sx={{
                      border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                      borderRadius: "8px",
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5, fontSize: "0.7rem" }}>
              JPEG, PNG, or WebP • Max 5MB • Powered by Cloudinary CDN
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              {user?.firstName} {user?.lastName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.email}
            </Typography>

            <Chip
              label={user ? ROLE_LABELS[user.role] || user.role : "User"}
              color="primary"
              variant="outlined"
              size="small"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor: "#EEF2FF",
                borderColor: "#C7D2FE",
                color: DESIGN_TOKENS.brand[700],
              }}
            />

            <Box sx={{ mt: 0.5 }}>
              <StatusChip status={user?.status || "ACTIVE"} />
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Information & Scope */}
        <Grid item xs={12} md={8}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                Account Information
              </Typography>
              {!isEditing ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    setFormData({
                      firstName: user?.firstName || "",
                      lastName: user?.lastName || "",
                      phone: user?.phone || user?.phoneNumber || "",
                    });
                    setIsEditing(true);
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    borderColor: DESIGN_TOKENS.line[200],
                    color: DESIGN_TOKENS.text.primary,
                  }}
                >
                  Edit Information
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setIsEditing(false)}
                  color="inherit"
                  sx={{ textTransform: "none" }}
                >
                  Cancel
                </Button>
              )}
            </Stack>

            {isEditing ? (
              <Box component="form" onSubmit={handleSaveProfile} sx={{ mt: 2 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      fullWidth
                      size="small"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      fullWidth
                      size="small"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      fullWidth
                      size="small"
                      value={user?.email || ""}
                      disabled
                      helperText="Email address is governed by system security and cannot be changed here."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      size="small"
                      placeholder="+923001234567"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      helperText="E.164 international format (e.g. +923001234567)"
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button variant="outlined" color="inherit" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={updateProfileMutation.isPending}
                    sx={{
                      bgcolor: DESIGN_TOKENS.brand[600],
                      "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                    }}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                    First Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                    {user?.firstName || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                    Last Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                    {user?.lastName || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                    {user?.email || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                    Phone Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                    {user?.phone || user?.phoneNumber || "Not provided"}
                  </Typography>
                </Grid>
              </Grid>
            )}

            <Divider sx={{ my: 3.5 }} />

            {/* Scope info */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
              Assigned Building Complexes (OBAC Scope)
            </Typography>

            {user?.role === "SUPER_ADMIN" ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  borderRadius: "10px",
                  borderColor: DESIGN_TOKENS.line[200],
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  SuperAdmin maintains global platform governance across all registered building complexes.
                </Typography>
              </Paper>
            ) : user?.assignedBuildingIds && user.assignedBuildingIds.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {user.assignedBuildingIds.map((bId) => (
                  <Chip
                    key={bId}
                    label={`Complex: ${bId}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No explicit building complex assigned.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
