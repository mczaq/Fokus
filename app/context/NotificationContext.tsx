"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface AppNotification {
  id: string;
  type:
    | "LATE_RETURN"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_REJECTED"
    | "EXTENSION_APPROVED"
    | "EXTENSION_REJECTED"
    | "REFUND_APPROVED"
    | "CANCEL_REJECTED";
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  createdAt: string;
  orderNumber: string;
  href: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const storageKey = `fokus_notif_read_${userId}`;

  // Muat daftar id yang sudah dibaca dari localStorage (per-pengguna).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setReadIds(raw ? JSON.parse(raw) : []);
    } catch {
      setReadIds([]);
    }
  }, [storageKey]);

  const persistRead = useCallback(
    (ids: string[]) => {
      setReadIds(ids);
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        /* localStorage mungkin tidak tersedia */
      }
    },
    [storageKey]
  );

  const refresh = useCallback(() => {
    if (!userId) return;
    fetch(`/api/notifications?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch((err) => console.error("Gagal memuat notifikasi:", err));
  }, [userId]);

  // Ambil saat mount dan polling tiap 30 detik.
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const isRead = useCallback((id: string) => readIds.includes(id), [readIds]);

  const markRead = useCallback(
    (id: string) => {
      if (!readIds.includes(id)) persistRead([...readIds, id]);
    },
    [readIds, persistRead]
  );

  const markAllRead = useCallback(() => {
    persistRead(Array.from(new Set([...readIds, ...notifications.map((n) => n.id)])));
  }, [readIds, notifications, persistRead]);

  const unreadCount = notifications.reduce(
    (count, n) => (readIds.includes(n.id) ? count : count + 1),
    0
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isRead, markRead, markAllRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
