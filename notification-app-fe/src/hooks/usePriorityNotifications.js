import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

function scoreNotification(n) {
  const weight = TYPE_WEIGHT[n.Type] || 1;
  const ageHours = (Date.now() - new Date(n.Timestamp).getTime()) / 3600000;
  const recency = 1 / (1 + ageHours);
  return weight * recency;
}

export function usePriorityNotifications({ topN = 10, notification_type } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({ page: 1, limit: 10, notification_type });
      const all = data.notifications ?? [];

      const scored = all
        .map(n => ({ ...n, score: scoreNotification(n) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

      setNotifications(scored);
    } catch (err) {
      setError(err.message || "Failed to load priority notifications");
    } finally {
      setLoading(false);
    }
  }, [topN, notification_type]);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, loading, error };
}
