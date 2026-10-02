import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id, paymentMethod, amount, proofImage, agreementAccepted } = await request.json();

    if (!id || !paymentMethod || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Data pembayaran tidak lengkap (ID, metode pembayaran, atau nominal belum diisi)." }, { status: 400 });
    }

    const isCashOrMidtrans = 
      paymentMethod.toUpperCase().includes("MIDTRANS") ||
      paymentMethod.toUpperCase().includes("CASH") ||
      paymentMethod.toUpperCase().includes("TUNAI");

    if (!proofImage && !isCashOrMidtrans) {
      return NextResponse.json({ error: "Wajib melampirkan foto bukti transfer atau resi struk pembayaran." }, { status: 400 });
    }

    const cleanId = String(id).trim();

    // 1. Try to find if this is an Order (by orderNumber or ID)
    let order = await prisma.order.findUnique({
      where: { orderNumber: cleanId },
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { id: cleanId },
      });
    }

    if (order) {
      // Record the customer's EULA acceptance, but keep the order PENDING.
      // Payment proof must be verified by an admin before the order is confirmed.
      await prisma.order.update({
        where: { id: order.id },
        data: {
          agreementAccepted: true,
          agreementAcceptedAt: new Date(),
        },
      });

      // Create Payment entry as PENDING (awaiting admin verification).
      const payment = await prisma.payment.create({
        data: {
          amount: Number(amount),
          method: paymentMethod,
          status: "PENDING",
          proofImage: proofImage || null,
          orderId: order.id,
        },
      });

      return NextResponse.json({ success: true, type: "order", pending: true, payment });
    }

    // 2. Try to find if this is a StudioBooking
    let booking = await prisma.studioBooking.findUnique({
      where: { id: cleanId },
    });

    // Try finding by suffix if ID is not direct
    if (!booking && cleanId.startsWith("STB-")) {
      const suffix = cleanId.replace("STB-", "").toLowerCase();
      const bookings = await prisma.studioBooking.findMany();
      booking = bookings.find(b => b.id.slice(-8).toLowerCase() === suffix) || null;
    }

    if (booking) {
      // Keep the booking PENDING — payment proof must be verified by an admin.
      // Create Payment entry as PENDING (awaiting admin verification).
      const payment = await prisma.payment.create({
        data: {
          amount: Number(amount),
          method: paymentMethod,
          status: "PENDING",
          proofImage: proofImage || null,
          bookingId: booking.id,
        },
      });

      return NextResponse.json({ success: true, type: "booking", pending: true, payment });
    }

    return NextResponse.json({ error: `Pesanan atau booking dengan ID '${cleanId}' tidak ditemukan.` }, { status: 404 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Failed to process payment webhook" }, { status: 500 });
  }
}
