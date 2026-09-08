import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { createMidtransTransaction } from "@/app/lib/midtrans";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId", token: null, redirect_url: null }, { status: 400 });
    }

    const cleanId = String(orderId).trim();

    // 1. Try to find if this is a direct Order by ID
    let order = await prisma.order.findUnique({
      where: { id: cleanId },
      include: { user: true }
    });

    // 2. Try to find if this is a Studio Booking (e.g. STB-XXXXXX)
    if (!order && (cleanId.startsWith("STB-") || cleanId.length === 25)) {
      let booking = await prisma.studioBooking.findUnique({
        where: { id: cleanId },
        include: { user: true, studio: true }
      });

      if (!booking && cleanId.startsWith("STB-")) {
        const suffix = cleanId.replace("STB-", "").toLowerCase();
        const bookings = await prisma.studioBooking.findMany({
          include: { user: true, studio: true }
        });
        booking = bookings.find(b => b.id.slice(-8).toLowerCase() === suffix) || null;
      }

      if (booking) {
        const result = await createMidtransTransaction({
          orderId: `STB-${booking.id.slice(-8).toUpperCase()}`,
          amount: booking.totalPrice,
          customerName: booking.user.name,
          customerEmail: booking.user.email
        });
        return NextResponse.json(result);
      }
    }

    // 3. Try to find if this is an Order by orderNumber
    if (!order) {
      order = await prisma.order.findUnique({
        where: { orderNumber: cleanId },
        include: { user: true }
      });
    }

    if (order) {
      const result = await createMidtransTransaction({
        orderId: order.orderNumber,
        amount: order.totalAmount,
        customerName: order.user.name,
        customerEmail: order.user.email
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Order/Booking not found", token: null, redirect_url: null }, { status: 200 });
  } catch (error: any) {
    console.error("Midtrans token creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment token", token: null, redirect_url: null }, { status: 200 });
  }
}
