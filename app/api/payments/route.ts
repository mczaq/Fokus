import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true, user: { select: { name: true } } } },
        booking: { select: { id: true, user: { select: { name: true } }, studio: { select: { name: true } } } }
      }
    });

    const mapped = payments.map((p) => ({
      id: p.id,
      trxId: "TRX-" + p.id.slice(-8).toUpperCase(),
      orderNumber: p.order?.orderNumber || (p.booking ? `STB-${p.booking.id.slice(-8).toUpperCase()}` : "—"),
      user: p.order?.user?.name || p.booking?.user?.name || "Pelanggan",
      type: p.order ? "order" : p.booking ? "booking" : "—",
      method: p.method,
      amount: "Rp " + p.amount.toLocaleString("id-ID"),
      rawAmount: p.amount,
      proofImage: p.proofImage || null,
      time: p.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      // rawStatus drives the admin verification UI; status is the display label.
      rawStatus: p.status,
      status: p.status === "CONFIRMED" ? "Diterima" :
              p.status === "REJECTED" ? "Ditolak" :
              p.status === "REFUNDED" ? "Refund" :
              "Pending",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
