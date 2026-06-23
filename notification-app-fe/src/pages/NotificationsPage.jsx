import { useState } from "react";
import {
  Alert, Badge, Box, Button, CircularProgress,
  Divider, Pagination, Stack, Typography
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const PAGE_SIZE = 10;

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { notifications, totalPages, loading, error, markAsRead, markAllAsRead, isRead, unreadCount } =
    useNotifications({
      page,
      limit: PAGE_SIZE,
      notification_type: filter === "All" ? undefined : filter
    });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Badge badgeContent={unreadCount} color="primary" max={99}>
            <NotificationsIcon sx={{ fontSize: 28 }} />
          </Badge>
          <Typography variant="h5" fontWeight={700}>
            Notifications
          </Typography>
        </Stack>
        {unreadCount > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={markAllAsRead}
            variant="outlined"
          >
            Mark all read
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isRead={isRead(n.ID)}
              onClick={markAsRead}
            />
          ))}
        </Stack>
      )}

      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
