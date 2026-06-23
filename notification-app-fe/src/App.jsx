import { useState } from "react";
import { Box, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ pb: 8, minHeight: "100vh", backgroundColor: "grey.100" }}>
      {tab === 0 && <NotificationsPage />}
      {tab === 1 && <PriorityInboxPage />}

      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation value={tab} onChange={(_, val) => setTab(val)}>
          <BottomNavigationAction label="Notifications" icon={<NotificationsIcon />} />
          <BottomNavigationAction label="Priority Inbox" icon={<StarIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
