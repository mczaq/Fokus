import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { calculateOrderFees } from "@/app/lib/feeHelper";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { paymentMethod, proofImage } = await request.json();

    let order = await prisma.order.findUnique({
      where: { orderNumber: id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { id: id },
        include: {
          items: true,
          payments: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const feeBreakdown = calculateOrderFees(order);
    const amountToPay = feeBreakdown.unpaidTotalFee;

    if (amountToPay <= 0) {
      return NextResponse.json({ error: "Tidak ada denda atau biaya tambahan yang perlu dibayar." }, { status: 400 });
    }

    // Record Payment with the exact unpaid amount
    await prisma.payment.create({
      data: {
        amount: amountToPay,
        method: paymentMethod || "TRANSFER",
        status: "CONFIRMED",
        proofImage: proofImage || null,
        confirmedAt: new Date(),
        orderId: order.id,
      },
    });

    // Update notes to track that these fees have been settled
    let parsedNotes: any = {};
    if (order.notes) {
      try {
        if (order.notes.trim().startsWith("{")) {
          parsedNotes = JSON.parse(order.notes);
        } else {
          parsedNotes = { userNotes: order.notes };
        }
      } catch {
        parsedNotes = { userNotes: order.notes };
      }
    }

    parsedNotes.paidFeeDetails = {
      lateFee: order.lateFee || 0,
      extensionFee: order.extensionFee || 0,
      damageFee: order.damageFee || 0,
      lossFee: order.lossFee || 0,
    };

    // Update fee status and totalAmount
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        feeStatus: "PAID",
        totalAmount: order.totalAmount + amountToPay,
        notes: JSON.stringify(parsedNotes),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran denda / biaya tambahan berhasil dikonfirmasi.",
      order: updatedOrder,
      paidAmount: amountToPay,
    });
  } catch (error) {
    console.error("Error paying fee:", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran denda" }, { status: 500 });
  }
}

