const { Log } = require("./logging-middleware/index");

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1
};

function getRecencyScore(timestamp) {
  const now = Date.now();
  const notifTime = new Date(timestamp).getTime();
  const ageInHours = (now - notifTime) / (1000 * 60 * 60);
  return 1 / (1 + ageInHours);
}

function scoreNotification(notification) {
  const weight = TYPE_WEIGHT[notification.Type] || 1;
  const recency = getRecencyScore(notification.Timestamp);
  return weight * recency;
}

function getTopN(notifications, n = 10) {
  Log("backend", "info", "handler", `Calculating top ${n} priority notifications from ${notifications.length} total`);

  if (!notifications || notifications.length === 0) {
    Log("backend", "warn", "handler", "No notifications provided to priority inbox function");
    return [];
  }

  const scored = notifications.map(notification => ({
    ...notification,
    score: scoreNotification(notification)
  }));

  scored.sort((a, b) => b.score - a.score);

  const result = scored.slice(0, n);

  Log("backend", "info", "handler", `Returning top ${result.length} notifications. Highest score: ${result[0]?.score?.toFixed(4)}`);

  return result;
}

function addNotificationToTopN(currentTopN, newNotification, n = 10) {
  const scored = {
    ...newNotification,
    score: scoreNotification(newNotification)
  };

  const updated = [...currentTopN, scored];
  updated.sort((a, b) => b.score - a.score);

  return updated.slice(0, n);
}

module.exports = { getTopN, addNotificationToTopN, scoreNotification };

async function runExample() {
  const sampleNotifications = [
    { ID: "1", Type: "Event", Message: "farewell party", Timestamp: "2026-04-22 17:51:06" },
    { ID: "2", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
    { ID: "3", Type: "Result", Message: "mid-sem results out", Timestamp: "2026-04-22 17:51:30" },
    { ID: "4", Type: "Placement", Message: "Advanced Micro Devices hiring", Timestamp: "2026-04-22 17:49:42" },
    { ID: "5", Type: "Event", Message: "tech-fest", Timestamp: "2026-04-22 17:50:06" },
    { ID: "6", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:18" },
    { ID: "7", Type: "Result", Message: "external exam", Timestamp: "2026-04-22 17:50:30" },
    { ID: "8", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:49:54" },
    { ID: "9", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:42" },
    { ID: "10", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:50:54" },
    { ID: "11", Type: "Event", Message: "sports day", Timestamp: "2026-04-22 17:48:00" },
    { ID: "12", Type: "Placement", Message: "Google hiring", Timestamp: "2026-04-22 17:47:00" }
  ];

  const top10 = await getTopN(sampleNotifications, 10);

  console.log("Top 10 Priority Notifications:");
  console.log("================================");
  top10.forEach((n, i) => {
    console.log(`${i + 1}. [${n.Type}] ${n.Message} | Score: ${n.score.toFixed(4)}`);
  });
}

runExample();
