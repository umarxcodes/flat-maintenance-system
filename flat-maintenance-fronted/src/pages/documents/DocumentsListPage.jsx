// =====================  DOCUMENTS REPOSITORY PAGE  ==========
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import ArticleIcon from "@mui/icons-material/Article";
import GavelIcon from "@mui/icons-material/Gavel";
import SecurityIcon from "@mui/icons-material/Security";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import {
  useDocumentsList,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from "../../features/documents/hooks/use-documents.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const DOCUMENT_TYPES = [
  { value: "SOCIETY_BYLAW", label: "Society Bylaws", icon: GavelIcon, color: "primary" },
  { value: "AGM_MINUTES", label: "AGM Minutes", icon: ArticleIcon, color: "info" },
  { value: "FLAT_DEED", label: "Title Deed", icon: DescriptionIcon, color: "success" },
  { value: "LEASE_CONTRACT", label: "Lease Contract", icon: DescriptionIcon, color: "warning" },
  { value: "INSURANCE_POLICY", label: "Insurance Policy", icon: SecurityIcon, color: "secondary" },
  { value: "AUDIT_REPORT", label: "Audit Report", icon: InsertDriveFileIcon, color: "error" },
  { value: "OTHER", label: "Other Document", icon: InsertDriveFileIcon, color: "default" },
];

const VISIBILITY_LEVELS = [
  { value: "PUBLIC_ALL_RESIDENTS", label: "Public (All Residents)", icon: PublicIcon, color: "success" },
  { value: "OWNERS_ONLY", label: "Property Owners Only", icon: LockIcon, color: "warning" },
  { value: "ADMIN_ONLY", label: "Management Admin Only", icon: LockIcon, color: "error" },
  { value: "FLAT_SPECIFIC", label: "Flat Specific Only", icon: LockIcon, color: "info" },
];

export const DocumentsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [inspectDoc, setInspectDoc] = useState(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState(null);

  // Form State for upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [docType, setDocType] = useState("SOCIETY_BYLAW");
  const [visibility, setVisibility] = useState("PUBLIC_ALL_RESIDENTS");
  const [flatId, setFlatId] = useState("");
  const [uploadError, setUploadError] = useState("");

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const { data: flatsData } = useFlatsList({ limit: 100 });
  const flats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);

  const queryParams = useMemo(() => {
    const params = {};
    if (typeFilter) params.documentType = typeFilter;
    if (visibilityFilter) params.visibility = visibilityFilter;
    return params;
  }, [typeFilter, visibilityFilter]);

  const { data, isLoading, isError, error, refetch } = useDocumentsList(queryParams);
  const uploadMutation = useUploadDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  const documents = data?.documents || (Array.isArray(data) ? data : []);

  // Filter client-side search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((d) => {
      const docTitle = (d.title || "").toLowerCase();
      const type = (d.documentType || "").toLowerCase();
      const vis = (d.visibility || "").toLowerCase();
      return docTitle.includes(q) || type.includes(q) || vis.includes(q);
    });
  }, [documents, searchQuery]);

  // Paginated slice for current page
  const paginatedDocuments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDocuments.slice(start, start + rowsPerPage);
  }, [filteredDocuments, page, rowsPerPage]);

  const totalCount = filteredDocuments.length;

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = documents.length;
    const bylaws = documents.filter(
      (d) => d.documentType === "SOCIETY_BYLAW" || d.documentType === "AGM_MINUTES"
    ).length;
    const deedsAndLeases = documents.filter(
      (d) => d.documentType === "FLAT_DEED" || d.documentType === "LEASE_CONTRACT"
    ).length;
    const publicDocs = documents.filter(
      (d) => d.visibility === "PUBLIC_ALL_RESIDENTS"
    ).length;
    return { total, bylaws, deedsAndLeases, publicDocs };
  }, [documents]);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setUploadError("");

    if (!selectedFile) {
      setUploadError("Please choose a document or image file to upload.");
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setUploadError("Document title must be at least 3 characters.");
      return;
    }
    if (!buildingId) {
      setUploadError("Target Building Complex is required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    formData.append("buildingId", buildingId);
    formData.append("documentType", docType);
    formData.append("visibility", visibility);
    if (visibility === "FLAT_SPECIFIC" && flatId) {
      formData.append("flatId", flatId);
    }

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setTitle("");
        setSelectedFile(null);
        setBuildingId("");
        setFlatId("");
      },
      onError: (err) => {
        setUploadError(err?.response?.data?.message || err?.message || "Failed to upload document.");
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteDocumentTarget) return;
    const targetId = deleteDocumentTarget.id || deleteDocumentTarget._id;
    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        setDeleteDocumentTarget(null);
        if (inspectDoc && (inspectDoc.id === targetId || inspectDoc._id === targetId)) {
          setInspectDoc(null);
        }
      },
    });
  };

  const getDocTypeConfig = (type) => {
    return (
      DOCUMENT_TYPES.find((d) => d.value === type) || {
        label: type || "Document",
        icon: InsertDriveFileIcon,
        color: "default",
      }
    );
  };

  const getVisibilityConfig = (vis) => {
    return (
      VISIBILITY_LEVELS.find((v) => v.value === vis) || {
        label: vis || "Standard",
        icon: LockIcon,
        color: "default",
      }
    );
  };

  const columns = [
    {
      id: "title",
      label: "Document Details",
      render: (val, row) => (
        <Box
          sx={{ cursor: "pointer" }}
          onClick={() => setInspectDoc(row)}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {val}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uploaded: {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-PK") : "—"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "documentType",
      label: "Classification",
      render: (val) => {
        const item = getDocTypeConfig(val);
        return (
          <Chip
            label={item.label}
            size="small"
            color={item.color}
            variant="soft"
            sx={{ fontWeight: 600, borderRadius: "6px" }}
          />
        );
      },
    },
    {
      id: "visibility",
      label: "Access Scope",
      render: (val) => {
        const item = getVisibilityConfig(val);
        return (
          <Chip
            label={item.label}
            size="small"
            variant="outlined"
            color={item.color}
            sx={{ fontWeight: 600, fontSize: "0.72rem", borderRadius: "6px" }}
          />
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => setInspectDoc(row)}
              sx={{ color: "text.secondary" }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {row.fileUrl && (
            <Tooltip title="Download File">
              <IconButton
                size="small"
                component="a"
                href={row.fileUrl}
                target="_blank"
                rel="noreferrer"
                sx={{ color: "primary.main" }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <PermissionGuard permission={PERMISSIONS.DOCUMENT_DELETE}>
            <Tooltip title="Delete Document">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteDocumentTarget(row)}
                disabled={deleteMutation.isPending}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Documents & Legal Repository"
        subtitle="Institutional archive for society bylaws, AGM minutes, title deeds, insurance policies, and lease agreements"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Documents" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.DOCUMENT_UPLOAD}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                setUploadError("");
                setIsUploadOpen(true);
              }}
              sx={{ borderRadius: "10px", fontWeight: 700 }}
            >
              Upload Document
            </Button>
          </PermissionGuard>
        }
      />

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Archive Files
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "#0B132B" }}>
                  {kpiMetrics.total}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <InsertDriveFileIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Bylaws & Minutes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
                  {kpiMetrics.bylaws}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <GavelIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Leases & Deeds
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>
                  {kpiMetrics.deedsAndLeases}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "warning.lighter",
                  color: "warning.main",
                }}
              >
                <DescriptionIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Public Resident Docs
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                  {kpiMetrics.publicDocs}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "success.lighter",
                  color: "success.main",
                }}
              >
                <PublicIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and View Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={typeFilter}
                label="Document Type"
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Types</em>
                </MenuItem>
                {DOCUMENT_TYPES.map((dt) => (
                  <MenuItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Access Visibility</InputLabel>
              <Select
                value={visibilityFilter}
                label="Access Visibility"
                onChange={(e) => {
                  setVisibilityFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Visibility Levels</em>
                </MenuItem>
                {VISIBILITY_LEVELS.map((vl) => (
                  <MenuItem key={vl.value} value={vl.value}>
                    {vl.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(searchQuery || typeFilter || visibilityFilter) && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("");
                  setVisibilityFilter("");
                  setPage(0);
                }}
                sx={{ alignSelf: "center", color: "text.secondary" }}
              >
                Reset
              </Button>
            )}
          </Stack>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Main Content Area: 4 States */}
      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: "14px" }} />
            </Grid>
          ))}
        </Grid>
      ) : isError ? (
        <Alert
          severity="error"
          sx={{ borderRadius: "12px", mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || "Failed to load documents archive from server."}
        </Alert>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description={
            searchQuery || typeFilter || visibilityFilter
              ? "No repository files matched your active search and filter criteria."
              : "Upload society bylaws, AGM minutes, or title deeds to establish an authoritative digital archive."
          }
          action={
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setIsUploadOpen(true)}
              sx={{ borderRadius: "10px" }}
            >
              Upload Document
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <Box>
          <Grid container spacing={2.5}>
            {paginatedDocuments.map((doc) => {
              const typeConfig = getDocTypeConfig(doc.documentType);
              const visConfig = getVisibilityConfig(doc.visibility);
              const DocIcon = typeConfig.icon;

              return (
                <Grid item xs={12} sm={6} md={4} key={doc._id || doc.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.08)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, pb: 1.5 }}>
                      {/* Top Badges */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            bgcolor: `${typeConfig.color}.lighter`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: `${typeConfig.color}.main`,
                          }}
                        >
                          <DocIcon fontSize="small" />
                        </Box>

                        <Chip
                          label={visConfig.label}
                          size="small"
                          variant="outlined"
                          color={visConfig.color}
                          sx={{ fontWeight: 600, fontSize: "0.68rem", borderRadius: "6px" }}
                        />
                      </Stack>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: "#0B132B",
                          cursor: "pointer",
                          lineHeight: 1.3,
                          "&:hover": { color: "primary.main" },
                        }}
                        onClick={() => setInspectDoc(doc)}
                      >
                        {doc.title}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {typeConfig.label}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                        Uploaded:{" "}
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </Typography>
                    </CardContent>

                    {/* Card Actions */}
                    <Box
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: "#F8FAFC",
                        borderTop: "1px solid #F1F5F9",
                        borderBottomLeftRadius: "14px",
                        borderBottomRightRadius: "14px",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setInspectDoc(doc)}
                          startIcon={<VisibilityIcon fontSize="small" />}
                        >
                          Inspect
                        </Button>

                        <Stack direction="row" spacing={0.5}>
                          {doc.fileUrl && (
                            <Tooltip title="Download Document">
                              <IconButton
                                size="small"
                                component="a"
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                color="primary"
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <PermissionGuard permission={PERMISSIONS.DOCUMENT_DELETE}>
                            <Tooltip title="Delete Document">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDocumentTarget(doc)}
                                disabled={deleteMutation.isPending}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        </Stack>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Simple Pagination Footer for Cards */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <DataTable
              columns={[]}
              rows={[]}
              isLoading={false}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(r) => {
                setRowsPerPage(r);
                setPage(0);
              }}
            />
          </Box>
        </Box>
      ) : (
        /* Data Table View */
        <DataTable
          columns={columns}
          rows={paginatedDocuments}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
        />
      )}

      {/* Upload Document Modal */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 1 }}>
          Upload Institutional Document
        </DialogTitle>
        <Box component="form" onSubmit={handleUploadSubmit} noValidate>
          <DialogContent dividers sx={{ p: 3 }}>
            {uploadError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
                {uploadError}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Target Building Complex</InputLabel>
                <Select
                  value={buildingId}
                  label="Target Building Complex"
                  onChange={(e) => setBuildingId(e.target.value)}
                >
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Document Title"
                placeholder="e.g. Society Bylaws 2026 Amended"
                fullWidth
                size="small"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helperText="Must be between 3 and 150 characters"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={docType}
                      label="Document Type"
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Access Visibility</InputLabel>
                    <Select
                      value={visibility}
                      label="Access Visibility"
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      {VISIBILITY_LEVELS.map((v) => (
                        <MenuItem key={v.value} value={v.value}>
                          {v.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {visibility === "FLAT_SPECIFIC" && (
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Destination Flat</InputLabel>
                  <Select
                    value={flatId}
                    label="Assigned Destination Flat"
                    onChange={(e) => setFlatId(e.target.value)}
                  >
                    {flats.map((f) => (
                      <MenuItem key={f._id || f.id} value={f._id || f.id}>
                        Flat {f.flatNumber} {f.blockId?.name ? `(${f.blockId.name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: selectedFile ? "primary.main" : "divider",
                  bgcolor: selectedFile ? "rgba(79, 70, 229, 0.03)" : "#F8FAFC",
                  p: 3,
                  textAlign: "center",
                  borderRadius: "12px",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <input
                  type="file"
                  id="document-upload-file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="document-upload-file">
                  <Button
                    variant={selectedFile ? "contained" : "outlined"}
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderRadius: "10px" }}
                  >
                    {selectedFile ? "Change Selected File" : "Choose File (PDF, PNG, JPG, WEBP)"}
                  </Button>
                </label>
                {selectedFile ? (
                  <Box sx={{ mt: 1.5, fontWeight: 600, fontSize: "0.85rem", color: "primary.main" }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Maximum file size: 10MB
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setIsUploadOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploadMutation.isPending || !selectedFile || !title.trim() || !buildingId}
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Inspect Document Modal */}
      <Dialog open={Boolean(inspectDoc)} onClose={() => setInspectDoc(null)} maxWidth="sm" fullWidth>
        {inspectDoc && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={getDocTypeConfig(inspectDoc.documentType).label}
                  size="small"
                  color={getDocTypeConfig(inspectDoc.documentType).color}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={getVisibilityConfig(inspectDoc.visibility).label}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1.5, color: "#0B132B" }}>
                {inspectDoc.title}
              </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Document Classification
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getDocTypeConfig(inspectDoc.documentType).label}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Access Scope
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getVisibilityConfig(inspectDoc.visibility).label}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Upload Date & Time
                  </Typography>
                  <Typography variant="body2">
                    {inspectDoc.createdAt ? new Date(inspectDoc.createdAt).toLocaleString() : "—"}
                  </Typography>
                </Grid>
              </Grid>

              {inspectDoc.fileUrl && (
                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #F1F5F9" }}>
                  <Button
                    variant="contained"
                    fullWidth
                    component="a"
                    href={inspectDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<OpenInNewIcon />}
                    sx={{ borderRadius: "10px", py: 1.2, fontWeight: 700 }}
                  >
                    Open / Download Document File
                  </Button>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setInspectDoc(null)} color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteDocumentTarget)}
        title="Delete Document Record"
        description={`Are you sure you want to delete "${deleteDocumentTarget?.title}" from the repository?`}
        confirmLabel="Delete Document"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDocumentTarget(null)}
      />
    </Box>
  );
};

export default DocumentsListPage;

