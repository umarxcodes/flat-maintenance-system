// =====================  NOTIFICATIONS LIST PAGE  =============
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  useNotificationsList,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../features/notifications/hooks/use-notifications.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const NotificationsListPage = () => {
  const { data, isLoading } = useNotificationsList();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications || (Array.isArray(data) ? data : []);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box>
      <PageHeader
        title="In-App Notifications"
        subtitle={`System notifications, financial reminders, gate alerts, and work order updates (${unreadCount} unread)`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
        action={
          unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              Mark All Read
            </Button>
          )
        }
      />

      {isLoading ? (
        <TableLoadingSkeleton rows={5} columns={2} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<NotificationsIcon />}
          title="All caught up!"
          description="You currently have no new notifications or alerts."
        />
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((item) => {
            const isUnread = !item.isRead;

            return (
              <Paper
                key={item.id || item._id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: isUnread ? "action.hover" : "background.paper",
                  borderColor: isUnread ? "primary.light" : "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: isUnread ? 700 : 500 }}>
                      {item.title}
                    </Typography>
                    {item.category && (
                      <Chip label={item.category} size="small" variant="outlined" />
                    )}
                    {isUnread && (
                      <Chip label="NEW" size="small" color="primary" sx={{ height: 20, fontSize: "0.6875rem" }} />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {item.message || item.body}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </Typography>
                </Box>

                {isUnread && (
                  <Tooltip title="Mark as Read">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => markReadMutation.mutate(item.id || item._id)}
                    >
                      <CheckCircleOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default NotificationsListPage;
