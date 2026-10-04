import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { computeLateFee } from "@/app/lib/lateFee";

// Feed notifikasi pelanggan diturunkan ("derived") dari data yang sudah ada —
// order, booking, dan payment — sehingga tidak butuh tabel/migrasi baru.
// Status "sudah dibaca" disimpan per-pengguna di localStorage sisi klien.

export type NotificationType =
  | "LATE_RETURN"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "EXTENSION_APPROVED"
  | "EXTENSION_REJECTED"
  | "REFUND_APPROVED"
  | "CANCEL_REJECTED";

interface AppNotification {
  id: string;
  type: NotificationType;
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  createdAt: string; // ISO
  orderNumber: string;
  href: string;
}

const fmtIDR = (n: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const toISO = (d: Date | string | null | undefined, fallback: Date): string => {
  if (!d) return fallback.toISOString();
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
};

const parseNotes = (notes: string | null): any => {
  if (!notes || !notes.startsWith("{")) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Parameter userId wajib diisi." }, { status: 400 });
  }

  try {
    const now = new Date();
    const notifs: AppNotification[] = [];
    const ORDERS_HREF = "/dashboard/orders";

    // ── Orders (equipment + jasa foto) ──────────────────────────────
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            equipment: { select: { name: true, pricePerDay: true } },
            service: { select: { name: true } },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    for (const o of orders) {
      const parsed = parseNotes(o.notes);

      // Pembayaran disetujui / ditolak admin
      for (const p of o.payments) {
        if (p.status === "CONFIRMED") {
          notifs.push({
            id: `pay-confirmed-${p.id}`,
            type: "PAYMENT_CONFIRMED",
            severity: "success",
            title: "Pembayaran Disetujui",
            message: `Pembayaran pesanan ${o.orderNumber} sebesar ${fmtIDR(p.amount)} telah disetujui admin. Pesanan Anda sedang diproses.`,
            createdAt: toISO(p.confirmedAt || p.updatedAt, o.createdAt),
            orderNumber: o.orderNumber,
            href: ORDERS_HREF,
          });
        } else if (p.status === "REJECTED") {
          notifs.push({
            id: `pay-rejected-${p.id}`,
            type: "PAYMENT_REJECTED",
            severity: "danger",
            title: "Pembayaran Ditolak",
            message: `Bukti pembayaran pesanan ${o.orderNumber} ditolak admin. Silakan periksa kembali dan lakukan pembayaran ulang.`,
            createdAt: toISO(p.updatedAt, o.createdAt),
            orderNumber: o.orderNumber,
            href: ORDERS_HREF,
          });
        }
      }

      // Perpanjangan sewa
      if (o.extensionRequestStatus === "APPROVED") {
        notifs.push({
          id: `ext-approved-${o.id}`,
          type: "EXTENSION_APPROVED",
          severity: "success",
          title: "Perpanjangan Disetujui",
          message: `Pengajuan perpanjangan sewa untuk pesanan ${o.orderNumber} telah disetujui admin.`,
          createdAt: toISO(o.updatedAt, o.createdAt),
          orderNumber: o.orderNumber,
          href: ORDERS_HREF,
        });
      } else if (o.extensionRequestStatus === "REJECTED") {
        notifs.push({
          id: `ext-rejected-${o.id}`,
          type: "EXTENSION_REJECTED",
          severity: "warning",
          title: "Perpanjangan Ditolak",
          message: `Pengajuan perpanjangan sewa untuk pesanan ${o.orderNumber} ditolak admin.`,
          createdAt: toISO(o.updatedAt, o.createdAt),
          orderNumber: o.orderNumber,
          href: ORDERS_HREF,
        });
      }

      // Refund / pembatalan
      const cr = parsed?.cancelRequest;
      if (cr?.status === "APPROVED") {
        const refunded = Boolean(cr.refunded) || Number(cr.refundAmount || 0) > 0;
        notifs.push({
          id: `cancel-approved-${o.id}`,
          type: "REFUND_APPROVED",
          severity: "success",
          title: refunded ? "Refund Disetujui" : "Pembatalan Disetujui",
          message: refunded
            ? `Pembatalan pesanan ${o.orderNumber} disetujui. Dana refund ${fmtIDR(cr.refundAmount || 0)} sedang diproses ke rekening Anda.`
            : `Pembatalan pesanan ${o.orderNumber} telah disetujui admin.`,
          createdAt: toISO(cr.approvedAt, o.updatedAt),
          orderNumber: o.orderNumber,
          href: ORDERS_HREF,
        });
      } else if (cr?.status === "REJECTED") {
        notifs.push({
          id: `cancel-rejected-${o.id}`,
          type: "CANCEL_REJECTED",
          severity: "warning",
          title: "Pengajuan Pembatalan Ditolak",
          message: `Pengajuan pembatalan pesanan ${o.orderNumber} ditolak admin.`,
          createdAt: toISO(cr.rejectedAt, o.updatedAt),
          orderNumber: o.orderNumber,
          href: ORDERS_HREF,
        });
      }

      // Keterlambatan pengembalian (hanya equipment yang belum dikembalikan &
      // dendanya belum dilunasi).
      const late = computeLateFee(o, now);
      if (late.isLate && String(o.feeStatus || "").toUpperCase() !== "PAID") {
        notifs.push({
          id: `late-${o.id}`,
          type: "LATE_RETURN",
          severity: "danger",
          title: "Keterlambatan Pengembalian",
          message: `Pesanan ${o.orderNumber} telat dikembalikan ${late.daysLate} hari. Denda berjalan ${fmtIDR(
            late.lateFee
          )} (${fmtIDR(late.dailyRate)}/hari). Mohon segera kembalikan untuk menghentikan denda.`,
          createdAt: toISO(o.endDate, o.updatedAt),
          orderNumber: o.orderNumber,
          href: ORDERS_HREF,
        });
      }
    }

    // ── Studio bookings ─────────────────────────────────────────────
    const bookings = await prisma.studioBooking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        studio: { select: { name: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    for (const b of bookings) {
      const label = `STB-${b.id.slice(-8).toUpperCase()}`;
      const parsed = parseNotes(b.notes);

      for (const p of b.payments) {
        if (p.status === "CONFIRMED") {
          notifs.push({
            id: `pay-confirmed-${p.id}`,
            type: "PAYMENT_CONFIRMED",
            severity: "success",
            title: "Pembayaran Disetujui",
            message: `Pembayaran booking studio ${label} sebesar ${fmtIDR(p.amount)} telah disetujui admin.`,
            createdAt: toISO(p.confirmedAt || p.updatedAt, b.createdAt),
            orderNumber: label,
            href: ORDERS_HREF,
          });
        } else if (p.status === "REJECTED") {
          notifs.push({
            id: `pay-rejected-${p.id}`,
            type: "PAYMENT_REJECTED",
            severity: "danger",
            title: "Pembayaran Ditolak",
            message: `Bukti pembayaran booking studio ${label} ditolak admin. Silakan lakukan pembayaran ulang.`,
            createdAt: toISO(p.updatedAt, b.createdAt),
            orderNumber: label,
            href: ORDERS_HREF,
          });
        }
      }

      if (b.extensionRequestStatus === "APPROVED") {
        notifs.push({
          id: `ext-approved-${b.id}`,
          type: "EXTENSION_APPROVED",
          severity: "success",
          title: "Perpanjangan Disetujui",
          message: `Pengajuan perpanjangan sesi studio ${label} telah disetujui admin.`,
          createdAt: toISO(b.updatedAt, b.createdAt),
          orderNumber: label,
          href: ORDERS_HREF,
        });
      }

      const cr = parsed?.cancelRequest;
      if (cr?.status === "APPROVED") {
        const refunded = Boolean(cr.refunded) || Number(cr.refundAmount || 0) > 0;
        notifs.push({
          id: `cancel-approved-${b.id}`,
          type: "REFUND_APPROVED",
          severity: "success",
          title: refunded ? "Refund Disetujui" : "Pembatalan Disetujui",
          message: refunded
            ? `Pembatalan booking studio ${label} disetujui. Dana refund ${fmtIDR(cr.refundAmount || 0)} sedang diproses.`
            : `Pembatalan booking studio ${label} telah disetujui admin.`,
          createdAt: toISO(cr.approvedAt, b.updatedAt),
          orderNumber: label,
          href: ORDERS_HREF,
        });
      } else if (cr?.status === "REJECTED") {
        notifs.push({
          id: `cancel-rejected-${b.id}`,
          type: "CANCEL_REJECTED",
          severity: "warning",
          title: "Pengajuan Pembatalan Ditolak",
          message: `Pengajuan pembatalan booking studio ${label} ditolak admin.`,
          createdAt: toISO(cr.rejectedAt, b.updatedAt),
          orderNumber: label,
          href: ORDERS_HREF,
        });
      }
    }

    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(notifs);
  } catch (error) {
    console.error("Error building notifications:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi." }, { status: 500 });
  }
}
