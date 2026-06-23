import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";

export function useNotifications({ page = 1, limit = 10, notification_type } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("readNotifications") || "[]"));
    } catch {
      return new Set();
    }
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({ page, limit, notification_type });
      setNotifications(data.notifications ?? []);
      setTotal(data.notifications?.length ?? 0);
      setTotalPages(Math.ceil((data.notifications?.length ?? 0) / limit) || 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, limit, notification_type]);

  useEffect(() => {
    load();
  }, [load]);

  const markAsRead = useCallback((id) => {
    setReadIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem("readNotifications", JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const updated = new Set(prev);
      notifications.forEach(n => updated.add(n.ID));
      localStorage.setItem("readNotifications", JSON.stringify([...updated]));
      return updated;
    });
  }, [notifications]);

  const isRead = useCallback((id) => readIds.has(id), [readIds]);

  const unreadCount = notifications.filter(n => !readIds.has(n.ID)).length;

  return { notifications, total, totalPages, loading, error, markAsRead, markAllAsRead, isRead, unreadCount };
}
