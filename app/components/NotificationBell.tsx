"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Ban,
  Info,
} from "lucide-react";
import { useNotifications, AppNotification } from "../context/NotificationContext";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function typeIcon(n: AppNotification) {
  switch (n.type) {
    case "LATE_RETURN":
      return <AlertTriangle className="w-4 h-4" />;
    case "PAYMENT_CONFIRMED":
      return <CheckCircle2 className="w-4 h-4" />;
    case "PAYMENT_REJECTED":
      return <XCircle className="w-4 h-4" />;
    case "EXTENSION_APPROVED":
      return <Clock className="w-4 h-4" />;
    case "EXTENSION_REJECTED":
      return <Clock className="w-4 h-4" />;
    case "REFUND_APPROVED":
      return <Wallet className="w-4 h-4" />;
    case "CANCEL_REJECTED":
      return <Ban className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function severityClasses(severity: AppNotification["severity"]) {
  switch (severity) {
    case "success":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "danger":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function NotificationBell() {
  const { notifications, unreadCount, isRead, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleOpenNotification = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifikasi"
        className="relative p-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-600 text-white text-[9px] font-bold rounded-full border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-[#FAF9F5]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-900">
              Notifikasi
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[22rem] overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => {
                const unread = !isRead(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleOpenNotification(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      unread ? "bg-blue-50/40 hover:bg-blue-50/70" : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full border ${severityClasses(
                        n.severity
                      )}`}
                    >
                      {typeIcon(n)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        {unread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-3">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
