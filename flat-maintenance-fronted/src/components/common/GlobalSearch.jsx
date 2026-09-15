// =====================  ENTERPRISE GLOBAL SEARCH (SECTION §36)  ===============
import React, { useState, useEffect, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import ButtonBase from "@mui/material/ButtonBase";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

// Material UI Icons
import SearchIcon from "@mui/icons-material/Search";
import ApartmentIcon from "@mui/icons-material/Apartment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CampaignIcon from "@mui/icons-material/Campaign";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";

import { useAuth } from "../../providers/auth-context.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { useMaintenanceRequestsList } from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useInvoicesList } from "../../features/invoices/hooks/use-invoices.js";
import { useComplaintsList } from "../../features/complaints/hooks/use-complaints.js";
import { useNoticesList } from "../../features/notices/hooks/use-notices.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

/**
 * Enterprise Global Search Modal & Trigger Component
 * Provides unified cross-entity search with keyboard navigation (Ctrl+K / Cmd+K).
 *
 * @param {Object} props
 * @param {boolean} [props.buttonOnly=false]
 * @param {Object} [props.sx={}]
 */
export const GlobalSearch = ({ buttonOnly = false, sx = {} }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, activeBuildingId } = useAuth();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live queries for searchable resources (scoped to active building if set)
  const { data: buildingsData, isLoading: lB } = useBuildingsList({ limit: 50 });
  const { data: flatsData, isLoading: lF } = useFlatsList({
    buildingId: activeBuildingId || undefined,
    limit: 100,
  });
  const { data: usersData, isLoading: lU } = useUsersList({ limit: 50 });
  const { data: requestsData, isLoading: lR } = useMaintenanceRequestsList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: invoicesData, isLoading: lI } = useInvoicesList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: complaintsData, isLoading: lC } = useComplaintsList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: noticesData, isLoading: lN } = useNoticesList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });

  const isLoading = lB || lF || lU || lR || lI || lC || lN;

  // Normalized Arrays
  const buildings = useMemo(() => buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []), [buildingsData]);
  const flats = useMemo(() => flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []), [flatsData]);
  const users = useMemo(() => usersData?.users || (Array.isArray(usersData) ? usersData : []), [usersData]);
  const requests = useMemo(() => requestsData?.requests || (Array.isArray(requestsData) ? requestsData : []), [requestsData]);
  const invoices = useMemo(() => invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []), [invoicesData]);
  const complaints = useMemo(() => complaintsData?.complaints || (Array.isArray(complaintsData) ? complaintsData : []), [complaintsData]);
  const notices = useMemo(() => noticesData?.notices || (Array.isArray(noticesData) ? noticesData : []), [noticesData]);

/**
 * Safely format physical address without crashing if address is an object
 */
const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.city, addr.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (addr.city || "");
};

/**
 * Format enum to sentence case
 */
const toSentenceCase = (str) => {
  if (!str) return "";
  const clean = String(str).replace(/_/g, " ").trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

  // Filter and group search results safely across all entities
  const groupedResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const groups = [];

    // 1. Buildings
    const matchedBuildings = buildings
      .filter((b) => {
        const addrStr = formatAddress(b.address).toLowerCase();
        const nameStr = String(b.name || "").toLowerCase();
        const codeStr = String(b.code || "").toLowerCase();
        return nameStr.includes(q) || codeStr.includes(q) || addrStr.includes(q);
      })
      .slice(0, 4)
      .map((b) => ({
        id: b._id || b.id,
        title: b.name,
        subtitle: `${b.code ? `Code: ${b.code}` : "Building"}${formatAddress(b.address) ? ` — ${formatAddress(b.address)}` : ""}`,
        link: b._id || b.id ? `/buildings/${b._id || b.id}` : "/buildings",
        icon: <ApartmentIcon fontSize="small" sx={{ color: DESIGN_TOKENS.brand[600] }} />,
        category: "Buildings",
      }));
    if (matchedBuildings.length > 0) {
      groups.push({ category: "Buildings", items: matchedBuildings });
    }

    // 2. Flats
    const matchedFlats = flats
      .filter((f) => {
        const numStr = String(f.flatNumber || "").toLowerCase();
        const typeStr = String(f.flatType || "").toLowerCase();
        return numStr.includes(q) || typeStr.includes(q);
      })
      .slice(0, 4)
      .map((f) => ({
        id: f._id || f.id,
        title: `Flat ${f.flatNumber}`,
        subtitle: `${toSentenceCase(f.flatType || "Apartment")} — ${toSentenceCase(f.status || "Vacant")}`,
        link: f._id || f.id ? `/flats/${f._id || f.id}` : "/flats",
        icon: <MeetingRoomIcon fontSize="small" sx={{ color: "#0284C7" }} />,
        category: "Flats",
      }));
    if (matchedFlats.length > 0) {
      groups.push({ category: "Flats", items: matchedFlats });
    }

    // 3. Maintenance Requests
    const matchedRequests = requests
      .filter((r) => {
        const titleStr = String(r.title || "").toLowerCase();
        const numStr = String(r.requestNumber || "").toLowerCase();
        const catStr = String(r.category || "").toLowerCase();
        return titleStr.includes(q) || numStr.includes(q) || catStr.includes(q);
      })
      .slice(0, 4)
      .map((r) => ({
        id: r._id || r.id,
        title: r.title,
        subtitle: `Ticket #${r.requestNumber || "WO"} — ${toSentenceCase(r.category)} (${toSentenceCase(r.status)})`,
        link: `/maintenance-requests`,
        icon: <BuildIcon fontSize="small" sx={{ color: "#D97706" }} />,
        category: "Maintenance Requests",
      }));
    if (matchedRequests.length > 0) {
      groups.push({ category: "Maintenance Requests", items: matchedRequests });
    }

    // 4. Invoices
    const matchedInvoices = invoices
      .filter((i) => {
        const numStr = String(i.invoiceNumber || "").toLowerCase();
        const periodStr = String(i.billingPeriod || "").toLowerCase();
        return numStr.includes(q) || periodStr.includes(q);
      })
      .slice(0, 4)
      .map((i) => ({
        id: i._id || i.id,
        title: `Invoice #${i.invoiceNumber}`,
        subtitle: `Period: ${i.billingPeriod || "Monthly"} — ₨${(Number(i.dueAmount) || Number(i.totalAmount) || 0).toLocaleString()} (${toSentenceCase(i.status)})`,
        link: i._id || i.id ? `/invoices/${i._id || i.id}` : "/invoices",
        icon: <ReceiptLongIcon fontSize="small" sx={{ color: "#059669" }} />,
        category: "Invoices",
      }));
    if (matchedInvoices.length > 0) {
      groups.push({ category: "Invoices", items: matchedInvoices });
    }

    // 5. Complaints
    const matchedComplaints = complaints
      .filter((c) => {
        const titleStr = String(c.title || "").toLowerCase();
        const numStr = String(c.complaintNumber || "").toLowerCase();
        return titleStr.includes(q) || numStr.includes(q);
      })
      .slice(0, 3)
      .map((c) => ({
        id: c._id || c.id,
        title: c.title,
        subtitle: `${c.complaintNumber ? `#${c.complaintNumber} — ` : ""}${toSentenceCase(c.type || "General")} (${toSentenceCase(c.status)})`,
        link: `/complaints`,
        icon: <ReportProblemIcon fontSize="small" sx={{ color: "#DC2626" }} />,
        category: "Complaints",
      }));
    if (matchedComplaints.length > 0) {
      groups.push({ category: "Complaints", items: matchedComplaints });
    }

    // 6. Notices
    const matchedNotices = notices
      .filter((n) => {
        const titleStr = String(n.title || "").toLowerCase();
        const contentStr = String(n.content || "").toLowerCase();
        return titleStr.includes(q) || contentStr.includes(q);
      })
      .slice(0, 3)
      .map((n) => ({
        id: n._id || n.id,
        title: n.title,
        subtitle: `${toSentenceCase(n.targetAudience || "All residents")} — Priority: ${toSentenceCase(n.priority || "Normal")}`,
        link: `/notices`,
        icon: <CampaignIcon fontSize="small" sx={{ color: "#7C3AED" }} />,
        category: "Notices",
      }));
    if (matchedNotices.length > 0) {
      groups.push({ category: "Notices", items: matchedNotices });
    }

    // 7. Users
    const matchedUsers = users
      .filter((u) => {
        const nameStr = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const emailStr = String(u.email || "").toLowerCase();
        return nameStr.includes(q) || emailStr.includes(q);
      })
      .slice(0, 3)
      .map((u) => ({
        id: u._id || u.id,
        title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        subtitle: `${toSentenceCase(u.role || "User")} — ${u.email}`,
        link: u._id || u.id ? `/users/${u._id || u.id}` : "/users",
        icon: <PersonIcon fontSize="small" sx={{ color: "#475569" }} />,
        category: "Users",
      }));
    if (matchedUsers.length > 0) {
      groups.push({ category: "Users", items: matchedUsers });
    }

    return groups;
  }, [query, buildings, flats, requests, invoices, complaints, notices, users]);

  // Flat list of all items for keyboard up/down selection
  const flatItems = useMemo(() => {
    return groupedResults.flatMap((g) => g.items);
  }, [groupedResults]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === "Enter" && flatItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatItems[selectedIndex].link);
    }
  };

  const handleSelect = (link) => {
    setOpen(false);
    setQuery("");
    navigate(link);
  };

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <>
      {/* Topbar Search Trigger Button */}
      <ButtonBase
        onClick={() => setOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          bgcolor: "#F1F5F9",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          px: 1.5,
          py: 0.75,
          minWidth: { xs: 40, sm: 180, md: 220 },
          justifyContent: { xs: "center", sm: "space-between" },
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: "#E2E8F0",
            borderColor: "#CBD5E1",
          },
          ...sx,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: "0.8125rem",
              color: "#64748B",
              fontFamily: FONT_UI,
            }}
          >
            Search...
          </Typography>
        </Stack>

        <Chip
          label={isMac ? "⌘K" : "Ctrl+K"}
          size="small"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            height: 20,
            fontSize: "0.6875rem",
            fontWeight: 700,
            bgcolor: "#FFFFFF",
            border: "1px solid #CBD5E1",
            color: "#475569",
            borderRadius: "6px",
            px: 0.25,
          }}
        />
      </ButtonBase>

      {/* Global Command Palette Search Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            border: "1px solid #E2E8F0",
            mt: { xs: 2, sm: 8 },
            verticalAlign: "top",
          },
        }}
      >
        {/* Search Input Bar */}
        <Box sx={{ p: 2, borderBottom: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
          <TextField
            autoFocus
            fullWidth
            inputRef={inputRef}
            placeholder="Search buildings, flats, work orders, invoices, residents..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: DESIGN_TOKENS.brand[600], fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                  {query && (
                    <IconButton size="small" onClick={() => setQuery("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Chip
                    label="ESC"
                    size="small"
                    onClick={() => setOpen(false)}
                    sx={{
                      cursor: "pointer",
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      bgcolor: "#F1F5F9",
                      color: "#64748B",
                      ml: 0.5,
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                border: "none",
                "& fieldset": { border: "none" },
                fontSize: "0.95rem",
                fontFamily: FONT_UI,
              },
            }}
          />
        </Box>

        {/* Search Results / Categories */}
        <DialogContent sx={{ p: 0, maxHeight: 420, overflowY: "auto", bgcolor: "#FAFAFA" }}>
          {!query.trim() ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#64748B", fontSize: "0.875rem", fontWeight: 500 }}>
                Type to search across residential units, invoices, work orders, and notices.
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                {["Tower A", "Flat 101", "INV-2026", "Plumbing", "Emergency"].map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => setQuery(tag)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      fontSize: "0.75rem",
                      "&:hover": { bgcolor: "#EEF2FF", borderColor: "#818CF8" },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ) : flatItems.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#64748B", fontSize: "0.875rem" }}>
                No records found matching &ldquo;{query}&rdquo;
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {groupedResults.map((group) => (
                <React.Fragment key={group.category}>
                  <ListSubheader
                    sx={{
                      bgcolor: "#F8FAFC",
                      lineHeight: "28px",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    {group.category} ({group.items.length})
                  </ListSubheader>
                  {group.items.map((item, idx) => {
                    const itemGlobalIndex = flatItems.findIndex((fi) => fi.id === item.id && fi.category === item.category);
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <ListItem key={`${item.category}-${item.id || idx}`} disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => handleSelect(item.link)}
                          sx={{
                            px: 2.5,
                            py: 1,
                            gap: 1.5,
                            bgcolor: isSelected ? "#EEF2FF !important" : "transparent",
                            borderLeft: isSelected ? `3px solid ${DESIGN_TOKENS.brand[600]}` : "3px solid transparent",
                            "&:hover": { bgcolor: "#F1F5F9" },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A" }}>
                                {item.title}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mt: 0.25 }}>
                                {item.subtitle}
                              </Typography>
                            }
                          />
                          <ArrowForwardIosIcon sx={{ fontSize: 12, color: "#94A3B8" }} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>

        {/* Footer info */}
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            bgcolor: "#FFFFFF",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
            Use <Box component="kbd" sx={{ bgcolor: "#F1F5F9", px: 0.75, py: 0.25, borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "0.6875rem", fontWeight: 700 }}>↑</Box> <Box component="kbd" sx={{ bgcolor: "#F1F5F9", px: 0.75, py: 0.25, borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "0.6875rem", fontWeight: 700 }}>↓</Box> to navigate, <Box component="kbd" sx={{ bgcolor: "#F1F5F9", px: 0.75, py: 0.25, borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "0.6875rem", fontWeight: 700 }}>↵</Box> to open
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#94A3B8" }}>
            {flatItems.length} results
          </Typography>
        </Box>
      </Dialog>
    </>
  );
};

GlobalSearch.propTypes = {
  buttonOnly: PropTypes.bool,
  sx: PropTypes.object,
};

export default GlobalSearch;
