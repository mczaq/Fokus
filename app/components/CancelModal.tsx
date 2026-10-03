"use client";

import { useState } from "react";

interface CancelModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClass =
  "w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors";

export default function CancelModal({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !orderId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!reason.trim()) {
      setErrorMsg("Mohon isi alasan pembatalan pesanan.");
      return;
    }
    if (!bankInfo.trim()) {
      setErrorMsg("Mohon isi nomor rekening & nama bank/e-wallet untuk pengembalian dana (refund).");
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg("Mohon isi nomor WhatsApp aktif untuk konfirmasi refund.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          bankInfo: bankInfo.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Pengajuan pembatalan berhasil dikirim.");
        setReason("");
        setBankInfo("");
        setWhatsapp("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Gagal mengajukan pembatalan.");
      }
    } catch (err) {
      console.error("Cancellation submit error:", err);
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
              PEMBATALAN &amp; REFUND
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
                Pengajuan Anda akan ditinjau oleh Admin. Setelah disetujui (ACC), status pesanan menjadi{" "}
                <strong className="text-slate-900">Dibatalkan</strong>, stok barang dikembalikan, dan dana diproses ke nomor rekening Anda.
              </p>
            </div>

            {errorMsg && (
              <p className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 p-2 border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                Alasan Pembatalan *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Ada acara keluarga mendadak, perubahan lokasi kegiatan, dll..."
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                Nomor Rekening &amp; Nama Bank / E-Wallet (Untuk Refund) *
              </label>
              <input
                type="text"
                required
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder="Contoh: BCA 1234567890 a.n Ahmad Dahlan"
                className={fieldClass}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1.5">
                Nomor WhatsApp / HP Aktif *
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className={fieldClass}
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
