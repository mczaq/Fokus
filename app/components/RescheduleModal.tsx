"use client";

import { useState } from "react";

interface RescheduleModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClass =
  "w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors";

// Today's date as YYYY-MM-DD in local timezone (avoids UTC off-by-one).
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function RescheduleModal({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !orderId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!startDate) {
      setErrorMsg("Mohon pilih tanggal jadwal baru Anda.");
      return;
    }
    if (startDate < todayStr()) {
      setErrorMsg("Tanggal jadwal baru tidak boleh sebelum hari ini.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStartDate: startDate,
          newEndDate: endDate || startDate,
          newStartTime: startTime,
          newEndTime: endTime,
          reason: reason.trim() || "Perubahan jadwal kegiatan pelanggan",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Pengajuan reschedule berhasil dikirim.");
        setStartDate("");
        setEndDate("");
        setReason("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Gagal mengajukan reschedule.");
      }
    } catch (err) {
      console.error("Reschedule submit error:", err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="bg-[#FAF9F5] border border-neutral-300 w-full max-w-lg relative shadow-2xl overflow-hidden animate-fade-up z-10">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">
              RESCHEDULE JADWAL
            </span>
            <h2 className="text-sm font-serif italic font-bold text-white">
              {orderId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content + Footer (wrapped in form so submit button works) */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-white">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Informasi Pengajuan</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tentukan tanggal &amp; jam jadwal baru yang Anda inginkan. Pengajuan ini akan ditinjau oleh Admin untuk disesuaikan dengan ketersediaan studio/alat.
              </p>
            </div>

            {errorMsg && (
              <p className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 p-2 border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                  Tanggal Baru *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayStr()}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                  Tanggal Selesai (Opsional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || todayStr()}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                  Jam Mulai (Khusus Studio)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                  Jam Selesai (Khusus Studio)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                Alasan Perubahan Jadwal (Opsional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Jadwal acara bergeser ke hari Sabtu, permohonan waktu penjemputan baru..."
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-slate-600 font-mono text-xs uppercase cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
