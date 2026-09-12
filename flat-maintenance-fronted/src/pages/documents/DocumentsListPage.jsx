// =====================  DOCUMENTS REPOSITORY PAGE  ==========
import React, { useState } from "react";
import Box from "@mui/material/Box";
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import {
  useDocumentsList,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from "../../features/documents/hooks/use-documents.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const DOCUMENT_TYPES = [
  "SOCIETY_BYLAW",
  "AGM_MINUTES",
  "FLAT_DEED",
  "LEASE_CONTRACT",
  "INSURANCE_POLICY",
  "AUDIT_REPORT",
  "OTHER",
];

const VISIBILITY_LEVELS = ["PUBLIC_ALL_RESIDENTS", "OWNERS_ONLY", "ADMIN_ONLY", "FLAT_SPECIFIC"];

export const DocumentsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(typeFilter && { documentType: typeFilter }),
  };

  const { data, isLoading } = useDocumentsList(queryParams);
  const uploadMutation = useUploadDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  const documents = data?.documents || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || documents.length;

  const [title, setTitle] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [docType, setDocType] = useState("SOCIETY_BYLAW");
  const [visibility, setVisibility] = useState("PUBLIC_ALL_RESIDENTS");

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || !title || !buildingId) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("buildingId", buildingId);
    formData.append("documentType", docType);
    formData.append("visibility", visibility);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setTitle("");
        setSelectedFile(null);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteDocumentTarget) return;
    deleteMutation.mutate(deleteDocumentTarget.id || deleteDocumentTarget._id, {
      onSuccess: () => {
        setDeleteDocumentTarget(null);
      },
    });
  };

  const columns = [
    {
      id: "title",
      label: "Document Title",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.originalFileName || "File"} •{" "}
            {row.fileSizeBytes ? `${(row.fileSizeBytes / 1024).toFixed(1)} KB` : ""}
          </Box>
        </Box>
      ),
    },
    {
      id: "documentType",
      label: "Document Type",
      render: (val) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: "visibility",
      label: "Access Scope",
      render: (val) => <Chip label={val} size="small" color="primary" variant="filled" />,
    },
    {
      id: "uploadedAt",
      label: "Upload Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {row.fileUrl && (
            <Tooltip title="Download File">
              <IconButton size="small" component="a" href={row.fileUrl} target="_blank">
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <PermissionGuard permission={PERMISSIONS.DOCUMENT_DELETE}>
            <Tooltip title="Delete Document">
              <IconButton size="small" color="error" onClick={() => setDeleteDocumentTarget(row)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Documents & Legal Repository"
        subtitle="Manage society bylaws, AGM minutes, title deeds, insurance policies, and lease contracts"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Documents" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.DOCUMENT_UPLOAD}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Document
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search documents by title..."
        onReset={() => {
          setSearch("");
          setTypeFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || typeFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
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
              <MenuItem key={dt} value={dt}>
                {dt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={documents}
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

      {/* Upload Document Modal */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Document File</DialogTitle>
        <Box component="form" onSubmit={handleUploadSubmit}>
          <DialogContent dividers>
            {uploadMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadMutation.error?.message || "Failed to upload document."}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Building Complex</InputLabel>
                <Select
                  value={buildingId}
                  label="Building Complex"
                  onChange={(e) => setBuildingId(e.target.value)}
                >
                  {buildings.map((b) => (
                    <MenuItem key={b.id || b._id} value={b.id || b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Document Title"
                placeholder="e.g. Society Bylaws 2026 Amended"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Document Category</InputLabel>
                  <Select
                    value={docType}
                    label="Document Category"
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Access Visibility</InputLabel>
                  <Select
                    value={visibility}
                    label="Access Visibility"
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    {VISIBILITY_LEVELS.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  p: 3,
                  textAlign: "center",
                  borderRadius: 2,
                }}
              >
                <input
                  type="file"
                  id="document-upload-file"
                  style={{ display: "none" }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="document-upload-file">
                  <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                    Select File (PDF, DOCX, IMG)
                  </Button>
                </label>
                {selectedFile && (
                  <Box
                    sx={{ mt: 1, fontWeight: 600, fontSize: "0.8125rem", color: "primary.main" }}
                  >
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Box>
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
              disabled={uploadMutation.isPending || !selectedFile || !title || !buildingId}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteDocumentTarget)}
        title="Delete Document"
        description={`Are you sure you want to delete document "${deleteDocumentTarget?.title}"?`}
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
