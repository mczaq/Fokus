"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export default function OverdueReturnPopup() {
  const { notifications } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const lateNotifs = notifications.filter((n) => n.type === "LATE_RETURN");
  const signature = lateNotifs.map((n) => n.id).sort().join("|");

  // Pop-up SELALU muncul lagi setiap kali pelanggan berpindah halaman
  // (pathname berubah) atau saat daftar keterlambatan berubah. Refresh halaman
  // otomatis me-reset state ini sehingga pop-up kembali tampil.
  useEffect(() => {
    setDismissed(false);
  }, [pathname, signature]);

  if (!signature || dismissed || lateNotifs.length === 0) return null;

  // Menutup hanya menyembunyikan untuk tampilan halaman saat ini; begitu pindah
  // halaman atau refresh, pop-up akan muncul kembali.
  const close = () => setDismissed(true);

  const goToOrders = () => {
    close();
    router.push("/dashboard/orders");
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs" onClick={close} />

      <div className="relative z-10 w-full max-w-md bg-white border border-rose-200 shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="bg-rose-700 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Keterlambatan Pengembalian</h3>
              <p className="text-[11px] text-rose-100 mt-0.5">
                {lateNotifs.length} pesanan melewati batas pengembalian
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Tutup"
            className="p-1 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Segera kembalikan barang sewa untuk menghentikan akumulasi denda keterlambatan yang
            bertambah setiap hari.
          </p>

          <div className="space-y-2">
            {lateNotifs.map((n) => (
              <div
                key={n.id}
                className="p-3 bg-rose-50 border border-rose-200 rounded-lg"
              >
                <p className="text-xs font-bold text-rose-900 font-mono">{n.orderNumber}</p>
                <p className="text-[11px] text-rose-800 leading-snug mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={close}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Nanti saja
          </button>
          <button
            onClick={goToOrders}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
          >
            Lihat Pesanan Saya
          </button>
        </div>
      </div>
    </div>
  );
}
