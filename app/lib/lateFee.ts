// Denda keterlambatan otomatis untuk penyewaan equipment.
//
// Aturan bisnis (dikonfirmasi pemilik studio):
//   Tarif denda per hari = 100% dari tarif sewa HARIAN item yang disewa.
//   Denda = jumlah hari telat × tarif harian seluruh item equipment.
//   Hari telat dihitung dari selisih endDate → sekarang, dibulatkan ke ATAS,
//   minimal 1 hari begitu melewati jatuh tempo.
//
// Denda berjalan (terus bertambah) selama barang belum dikembalikan. Begitu
// barang dikembalikan (actualReturn terisi) atau order selesai/batal, akrual
// berhenti dan nilai denda final yang dibekukan admin saat inspeksi dipakai.

export interface LateFeeResult {
  isLate: boolean;
  daysLate: number;
  overdueHours: number;
  dailyRate: number; // total tarif sewa harian untuk seluruh item equipment
  lateFee: number; // daysLate × dailyRate
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Status order yang masih "berjalan" sehingga keterlambatan pengembalian relevan.
const OPEN_STATUSES = ["ACTIVE", "PROCESSING", "OVERDUE"];

// Item dianggap equipment (punya siklus pickup/return) bila bukan jasa/service.
function isEquipmentItem(item: any): boolean {
  if (!item) return false;
  if (item.serviceId || item.service) return false;
  return Boolean(item.equipmentId || item.equipment) || true;
}

// Total tarif sewa per hari dari seluruh item equipment dalam order.
export function computeDailyRate(items: any[] = []): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    if (!isEquipmentItem(item)) return sum;
    const price = Number(item.price ?? item.equipment?.pricePerDay ?? 0);
    const qty = Number(item.quantity ?? 1);
    return sum + price * qty;
  }, 0);
}

export function computeLateFee(order: any, now: Date = new Date()): LateFeeResult {
  const empty: LateFeeResult = {
    isLate: false,
    daysLate: 0,
    overdueHours: 0,
    dailyRate: 0,
    lateFee: 0,
  };
  if (!order) return empty;

  // Sudah dikembalikan / selesai / dibatalkan → tidak ada akrual denda berjalan.
  if (order.actualReturn) return empty;
  const status = String(order.status || "").toUpperCase();
  if (!OPEN_STATUSES.includes(status)) return empty;

  const endDate = order.endDate ? new Date(order.endDate) : null;
  if (!endDate || isNaN(endDate.getTime())) return empty;

  const diffMs = now.getTime() - endDate.getTime();
  if (diffMs <= 0) return empty; // belum lewat jatuh tempo

  const overdueHours = Math.max(1, Math.floor(diffMs / HOUR_MS));
  const daysLate = Math.max(1, Math.ceil(diffMs / DAY_MS));
  const dailyRate = computeDailyRate(order.items);
  const lateFee = daysLate * dailyRate;

  return { isLate: true, daysLate, overdueHours, dailyRate, lateFee };
}
