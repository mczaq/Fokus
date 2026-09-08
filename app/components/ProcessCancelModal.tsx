"use client";

import { useState, useEffect } from "react";

interface ProcessCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: any | null;
  onConfirm: (
    id: string,
    action: "ACC_CANCEL" | "REJECT_CANCEL",
    data?: {
      refundAmount?: number;
      reason?: string;
      bankInfo?: string;
      whatsapp?: string;
      adminNotes?: string;
    }
  ) => Promise<void>;
  loadingAction?: boolean;
}

export default function ProcessCancelModal({
  isOpen,
  onClose,
  rental,
  onConfirm,
  loadingAction = false,
}: ProcessCancelModalProps) {
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [bankInfo, setBankInfo] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (rental) {
      const cancelReq = rental.cancelRequest;
      setRefundAmount(
        cancelReq?.refundAmount !== undefined && cancelReq?.refundAmount !== null
          ? Number(cancelReq.refundAmount)
          : rental.totalAmount || 0
      );
      setBankInfo(cancelReq?.bankInfo || "");
      setWhatsapp(cancelReq?.whatsapp || rental.borrower?.phone || "");
      setReason(cancelReq?.reason || "Pembatalan pesanan sewa");
      setAdminNotes(cancelReq?.adminNotes || "");
      setRejectReason(cancelReq?.rejectReason || "");
      setShowRejectForm(false);
      setErrorMsg("");
    }
  }, [rental]);

  if (!isOpen || !rental) return null;

  const cancelReq = rental.cancelRequest;
  const isPending = cancelReq?.status === "PENDING_ACC";
  const isAlreadyApproved = cancelReq?.status === "APPROVED" || rental.status === "CANCELLED";

  const formatIDR = (n: number) => "Rp " + (n || 0).toLocaleString("id-ID");

  const formatWaLink = (phoneStr?: string) => {
    if (!phoneStr) return "#";
    let cleaned = phoneStr.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
    return `https://wa.me/${cleaned}`;
  };

  const handleApprove = async () => {
    setErrorMsg("");
    if (!bankInfo.trim()) {
      setErrorMsg("Mohon pastikan informasi nomor rekening & bank penerima refund terisi.");
      return;
    }
    if (refundAmount < 0) {
      setErrorMsg("Nominal refund tidak boleh kurang dari 0.");
      return;
    }

    await onConfirm(rental.id, "ACC_CANCEL", {
      refundAmount: Number(refundAmount),
      bankInfo: bankInfo.trim(),
      whatsapp: whatsapp.trim(),
      reason: reason.trim(),
      adminNotes: adminNotes.trim(),
    });
  };

  const handleReject = async () => {
    setErrorMsg("");
    if (!rejectReason.trim()) {
      setErrorMsg("Mohon isi alasan penolakan pengajuan pembatalan.");
      return;
    }

    await onConfirm(rental.id, "REJECT_CANCEL", {
      adminNotes: rejectReason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-up border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-700 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">
              {rental.type === "STUDIO" ? "🎙️" : rental.type === "SERVICE" ? "📸" : "📷"}
            </div>
            <div>
              <h3 className="font-bold text-base">
                Proses Pembatalan &amp; Refund {rental.type === "STUDIO" ? "Studio" : rental.type === "SERVICE" ? "Jasa Foto" : "Alat"}
              </h3>
              <p className="text-[11px] text-rose-200 font-mono">
                No. Transaksi: {rental.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Info Card: Detail Sewa & Pelanggan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Informasi Sewa &amp; Pelanggan
              </span>
              <span className="font-mono text-slate-900 font-extrabold text-sm">
                Total: {formatIDR(rental.totalAmount)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Pelanggan:</span>
                <p className="font-bold text-slate-900 text-xs">{rental.borrower?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">📞 {rental.borrower?.phone || "—"}</p>
                <p className="text-slate-400 text-[11px] truncate">✉️ {rental.borrower?.email || "—"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                  {rental.type === "STUDIO" ? "Studio:" : rental.type === "SERVICE" ? "Jasa Fotografi:" : "Item Alat:"}
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  {rental.studio?.name
                    ? `Studio ${rental.studio.name}`
                    : rental.items?.map((i: any) => i.equipment?.name || i.service?.name).filter(Boolean).join(", ") || "Sewa"}
                </p>
                {rental.type === "STUDIO" && (
                  <p className="text-purple-700 font-semibold text-[11px] mt-0.5">
                    ⏱️ {rental.startTime} - {rental.endTime} ({rental.items[0]?.duration || 1} Jam)
                  </p>
                )}
                {rental.type === "SERVICE" && rental.items[0]?.service?.duration && (
                  <p className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                    📸 Durasi: {rental.items[0].service.duration}
                  </p>
                )}
                <p className="text-slate-500 text-[11px]">
                  📅 Tanggal: {new Date(rental.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Cancel Request Details (if requested by user) */}
          {cancelReq ? (
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-rose-200/70 pb-1.5">
                <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <span>🚨</span> Pengajuan Pembatalan Pengguna
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    cancelReq.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : cancelReq.status === "REJECTED"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-rose-200/70 text-rose-800 animate-pulse"
                  }`}
                >
                  {cancelReq.status === "APPROVED"
                    ? "✓ DISETUJUI / REFUNDED"
                    : cancelReq.status === "REJECTED"
                    ? "✕ DITOLAK"
                    : "MENUNGGU PERSETUJUAN (ACC)"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] font-bold block">Alasan Pengguna:</span>
                <p className="text-slate-800 font-medium italic bg-white p-2.5 rounded-lg border border-rose-100 mt-1">
                  "{cancelReq.reason}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] font-bold block">Nomor Rekening Refund:</span>
                  <div className="bg-white p-2 rounded-lg border border-rose-100 font-mono font-bold text-slate-800 text-xs mt-0.5">
                    🏦 {cancelReq.bankInfo || "—"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] font-bold block">Kontak WhatsApp:</span>
                  <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-rose-100 mt-0.5">
                    <span className="font-mono font-bold text-slate-800 text-xs px-1">
                      📱 {cancelReq.whatsapp || "—"}
                    </span>
                    {cancelReq.whatsapp && (
                      <a
                        href={formatWaLink(cancelReq.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        💬 WA
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {cancelReq.requestedAt && (
                <p className="text-[10px] text-slate-400 font-mono text-right pt-0.5">
                  Diajukan pada: {new Date(cancelReq.requestedAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold flex items-center gap-1">ℹ️ Pembatalan Langsung oleh Admin</span>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Penyewa belum mengisi form pengajuan website (misal: permintaan melalui kasir/WhatsApp). Anda dapat memasukkan detail rekening dan nominal pengembalian dana untuk mencatat refund di pembukuan keuangan.
              </p>
            </div>
          )}

          {/* Form Pemrosesan Refund (Hanya jika belum disetujui / dibatalkan) */}
          {!isAlreadyApproved ? (
            <div className="space-y-3 pt-1">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Konfirmasi Pembatalan &amp; Pengembalian Dana (Refund)
              </h4>

              {showRejectForm ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-up">
                  <label className="block text-xs font-bold text-slate-700">
                    Alasan Penolakan Pembatalan *
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Jadwal studio sudah kurang dari 2 jam lagi / tidak memenuhi syarat pembatalan..."
                    className="input-modern text-xs py-2 resize-none"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={loadingAction}
                      onClick={handleReject}
                      className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
                    >
                      {loadingAction ? "Memproses..." : "Konfirmasi Tolak Pengajuan"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nominal Refund (Rp) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={rental.totalAmount}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        className="input-modern text-xs py-2 font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Default 100%: {formatIDR(rental.totalAmount)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        No. Rekening &amp; Bank Refund *
                      </label>
                      <input
                        type="text"
                        value={bankInfo}
                        onChange={(e) => setBankInfo(e.target.value)}
                        placeholder="Contoh: BCA 12345678 a.n John"
                        className="input-modern text-xs py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Catatan Admin / No. Ref Transfer Refund (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Contoh: Dana Rp 300.000 telah ditransfer via BCA, bukti transfer telah dikirimkan ke WA penyewa."
                      className="input-modern text-xs py-2 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                ✓ Pesanan Telah Dibatalkan &amp; Refund Selesai Diproses
              </span>
              <p className="text-slate-600 text-xs">
                Nominal refund tercatat: <strong className="font-mono text-emerald-900">{formatIDR(refundAmount)}</strong> dialokasikan ke <strong className="font-mono">{bankInfo}</strong>.
              </p>
              {adminNotes && (
                <p className="text-slate-600 text-[11px] italic pt-1">
                  Catatan: "{adminNotes}"
                </p>
              )}
              {cancelReq?.approvedAt && (
                <p className="text-slate-400 text-[10px] font-mono pt-1">
                  Waktu persetujuan: {new Date(cancelReq.approvedAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {!isAlreadyApproved && !showRejectForm && (
            <div className="flex items-center gap-2">
              {isPending && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => setShowRejectForm(true)}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  ✕ Tolak Pengajuan
                </button>
              )}
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleApprove}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>
                  {loadingAction
                    ? "Memproses..."
                    : isPending
                    ? "Setujui Pembatalan & Catat Refund"
                    : "Batalkan & Catat Refund"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
