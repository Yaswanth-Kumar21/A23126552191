import { Box, Chip, Paper, Typography } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

const TYPE_COLOR = {
  Placement: "success",
  Result: "warning",
  Event: "info"
};

export function NotificationCard({ notification, isRead, onClick }) {
  return (
    <Paper
      onClick={() => onClick && onClick(notification.ID)}
      elevation={isRead ? 0 : 2}
      sx={{
        p: 2,
        cursor: "pointer",
        borderLeft: isRead ? "3px solid transparent" : "3px solid",
        borderColor: isRead ? "transparent" : "primary.main",
        backgroundColor: isRead ? "grey.50" : "background.paper",
        transition: "all 0.2s",
        "&:hover": { backgroundColor: "action.hover" }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          {!isRead && (
            <CircleIcon sx={{ fontSize: 10, color: "primary.main", flexShrink: 0 }} />
          )}
          <Typography
            variant="body1"
            fontWeight={isRead ? 400 : 600}
            sx={{ color: isRead ? "text.secondary" : "text.primary" }}
          >
            {notification.Message}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5} ml={2}>
          <Chip
            label={notification.Type}
            color={TYPE_COLOR[notification.Type] || "default"}
            size="small"
          />
          <Typography variant="caption" color="text.disabled">
            {new Date(notification.Timestamp).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
