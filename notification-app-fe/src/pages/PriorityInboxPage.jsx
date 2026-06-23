import { useState } from "react";
import {
  Alert, Box, CircularProgress, Divider,
  Slider, Stack, Typography
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { usePriorityNotifications } from "../hooks/usePriorityNotifications";

export function PriorityInboxPage() {
  const [topN, setTopN] = useState(10);
  const [filter, setFilter] = useState("All");  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("readNotifications") || "[]"));
    } catch {
      return new Set();
    }
  });

  const { notifications, loading, error } = usePriorityNotifications({
    topN,
    notification_type: filter === "All" ? undefined : filter
  });

  const markAsRead = (id) => {
    setReadIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem("readNotifications", JSON.stringify([...updated]));
      return updated;
    });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <StarIcon sx={{ fontSize: 28, color: "warning.main" }} />
        <Typography variant="h5" fontWeight={700}>
          Priority Inbox
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Show top {topN} notifications
        </Typography>
        <Slider
          value={topN}
          onChange={(_, val) => setTopN(val)}
          min={3}
          max={10}
          step={1}
          marks={[
            { value: 3, label: "3" },
            { value: 5, label: "5" },
            { value: 7, label: "7" },
            { value: 10, label: "10" }
          ]}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={(v) => setFilter(v)} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load: {error}</Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No priority notifications found.</Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={1.5}>
          {notifications.map((n, idx) => (
            <Box key={n.ID}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}>
                  #{idx + 1}
                </Typography>
              </Stack>
              <NotificationCard
                notification={n}
                isRead={readIds.has(n.ID)}
                onClick={markAsRead}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
