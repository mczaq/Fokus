"use client";

import { useState } from "react";

interface ReturnInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: any;
  onSuccess: () => void;
}

export default function ReturnInspectionModal({
  isOpen,
  onClose,
  rental,
  onSuccess,
}: ReturnInspectionModalProps) {
  const [condition, setCondition] = useState<"NORMAL" | "DAMAGED" | "LOST">("NORMAL");
  const [damageNotes, setDamageNotes] = useState("");
  const [damageFee, setDamageFee] = useState<number>(0);
  const [lostItemIds, setLostItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !rental) return null;

  // Calculate 100% loss fee based on selected lost equipment total value
  const totalItemValue = rental.items?.reduce((sum: number, item: any) => {
    if (item.equipment && lostItemIds.includes(item.id)) {
      const originalPrice = item.equipment.originalPrice || 0;
      return sum + originalPrice * (item.quantity || 1);
    }
    return sum;
  }, 0) || 0;

  const handleConfirmReturn = async () => {
    if (condition === "DAMAGED" && (!damageNotes || damageFee <= 0)) {
      setError("⚠️ Wajib mengisi catatan deskripsi kerusakan dan estimasi biaya perbaikan!");
      return;
    }
    if (condition === "LOST" && lostItemIds.length === 0) {
      setError("⚠️ Wajib memilih minimal satu barang yang hilang!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const calculatedLossFee = condition === "LOST" ? totalItemValue : 0;
      const calculatedLateFee = rental.isOverdue ? (rental.overdueHours || 1) * 25000 : 0;

      const res = await fetch(`/api/orders/${rental.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_INSPECTION",
          conditionStatus: condition,
          damageNotes: condition !== "NORMAL" ? damageNotes : null,
          damageFee: condition === "DAMAGED" ? damageFee : 0,
          lossFee: calculatedLossFee,
          lateFee: calculatedLateFee,
        }),
      });

      if (res.ok) {
        alert("Pemeriksaan pengembalian berhasil disimpan.");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memproses pengembalian.");
      }
    } catch {
      setError("Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[180] overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-xs" onClick={onClose} />

      <div className="bg-[#FAF9F5] border border-neutral-300 w-full max-w-lg relative shadow-2xl overflow-hidden animate-fade-up z-10">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">
              FORM INSPEKSI PENGEMBALIAN BARANG
            </span>
            <h2 className="text-sm font-serif italic font-bold text-white">
              {rental.orderNumber} &bull; {rental.borrower?.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-white">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-400 uppercase block">Daftar Unit Yang Dikembalikan:</span>
            <div className="font-bold text-slate-900 mt-0.5">
              {rental.items?.map((i: any) => i.equipment?.name || i.name).join(", ")}
            </div>
            {rental.isOverdue && (
              <div className="mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 p-1 border border-rose-200">
                ⚠️ Terlambat: {rental.overdueHours || 1} jam (Denda keterlambatan otomatis ditagihkan)
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-2">
              Pilih Hasil Inspeksi Kondisi Barang:
            </label>
            <div className="space-y-2">
              <label className={`flex items-center p-3 border rounded cursor-pointer transition-all ${
                condition === "NORMAL" ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold" : "border-slate-200 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="condition"
                  value="NORMAL"
                  checked={condition === "NORMAL"}
                  onChange={() => setCondition("NORMAL")}
                  className="w-4 h-4 text-emerald-600 accent-emerald-600 mr-2.5"
                />
                <span>🟢 Tidak Ada Kerusakan (Kondisi Baik &amp; Normal)</span>
              </label>

              <label className={`flex items-center p-3 border rounded cursor-pointer transition-all ${
                condition === "DAMAGED" ? "border-neutral-500 bg-neutral-50/70 text-neutral-950 font-bold" : "border-slate-200 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="condition"
                  value="DAMAGED"
                  checked={condition === "DAMAGED"}
                  onChange={() => setCondition("DAMAGED")}
                  className="w-4 h-4 text-neutral-600 accent-neutral-600 mr-2.5"
                />
                <span>🔴 Ada Kerusakan (Cacat, Terbentur, Servis)</span>
              </label>

              <label className={`flex items-center p-3 border rounded cursor-pointer transition-all ${
                condition === "LOST" ? "border-rose-500 bg-rose-50/70 text-rose-950 font-bold" : "border-slate-200 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="condition"
                  value="LOST"
                  checked={condition === "LOST"}
                  onChange={() => setCondition("LOST")}
                  className="w-4 h-4 text-rose-600 accent-rose-600 mr-2.5"
                />
                <span>❌ Barang Hilang (100% Ganti Rugi Pembelian Baru)</span>
              </label>
            </div>
          </div>

          {/* Damage input form */}
          {condition === "DAMAGED" && (
            <div className="p-3.5 bg-neutral-50 border border-neutral-300 rounded space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-900 block mb-1">
                  Catatan Rincian Kerusakan:
                </label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Contoh: Lensa gores bagian depan, tombol shutter macet..."
                  className="w-full input-modern text-xs bg-white p-2 border border-neutral-300"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-900 block mb-1">
                  Estimasi Biaya Perbaikan (Rp):
                </label>
                <input
                  type="number"
                  value={damageFee}
                  onChange={(e) => setDamageFee(Number(e.target.value))}
                  placeholder="Masukkan estimasi biaya perbaikan..."
                  className="w-full input-modern text-xs bg-white p-2 border border-neutral-300 font-bold"
                />
              </div>
            </div>
          )}

          {/* Loss penalty info & item selection */}
          {condition === "LOST" && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-950 rounded text-[11px] space-y-3">
              <div className="font-bold uppercase border-b border-rose-200 pb-1">
                ⚠️ Ketentuan Ganti Rugi Kehilangan:
              </div>
              <p className="text-rose-900">
                Silakan pilih barang yang hilang dari daftar sewa di bawah untuk menentukan total denda penggantian 100%:
              </p>
              
              <div className="space-y-2 py-1">
                {rental.items?.filter((item: any) => item.equipment).map((item: any) => {
                  const isChecked = lostItemIds.includes(item.id);
                  return (
                    <label key={item.id} className="flex items-start gap-2.5 p-2 bg-white border border-rose-100 rounded cursor-pointer hover:bg-rose-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setLostItemIds(lostItemIds.filter(id => id !== item.id));
                          } else {
                            setLostItemIds([...lostItemIds, item.id]);
                          }
                        }}
                        className="w-4 h-4 text-rose-600 accent-rose-600 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">{item.equipment.name}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Harga Asli: Rp {(item.equipment.originalPrice || 0).toLocaleString("id-ID")} x {item.quantity || 1} unit
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="font-extrabold text-xs text-rose-750 pt-2 border-t border-rose-200">
                Total Denda Kehilangan: Rp {totalItemValue.toLocaleString("id-ID")}
              </div>
            </div>
          )}

          {error && (
            <p className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 p-2 border border-rose-200">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 text-slate-600 font-mono text-xs uppercase"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmReturn}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "✓ Selesaikan Pengembalian"}
          </button>
        </div>
      </div>
    </div>
  );
}
