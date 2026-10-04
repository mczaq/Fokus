import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { calculateOrderFees } from "@/app/lib/feeHelper";
import { computeLateFee } from "@/app/lib/lateFee";

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
      const studioBooking = await prisma.studioBooking.findUnique({
        where: { id: id },
      });

      if (studioBooking) {
        // Simple logic for Studio Booking payment
        const amountToPay = studioBooking.extensionFee || 0;
        
        if (amountToPay <= 0 || studioBooking.feeStatus === "PAID") {
          return NextResponse.json({ error: "Tidak ada denda atau biaya tambahan yang perlu dibayar." }, { status: 400 });
        }

        const updatedBooking = await prisma.studioBooking.update({
          where: { id: studioBooking.id },
          data: {
            feeStatus: "PAID",
            totalPrice: studioBooking.totalPrice + amountToPay,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Pembayaran perpanjangan studio berhasil dikonfirmasi.",
          order: updatedBooking,
          paidAmount: amountToPay,
        });
      }

      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Sertakan denda keterlambatan berjalan (hari telat × tarif harian) walau
    // belum difinalisasi admin, sehingga pelanggan bisa melunasinya dari sini.
    const late = computeLateFee(order);
    const effectiveLateFee = late.isLate ? late.lateFee : order.lateFee || 0;

    const feeBreakdown = calculateOrderFees({ ...order, lateFee: effectiveLateFee });
    const amountToPay = feeBreakdown.unpaidTotalFee;

    if (amountToPay <= 0) {
      return NextResponse.json({ error: "Tidak ada denda atau biaya tambahan yang perlu dibayar." }, { status: 400 });
    }

    // Catat pembayaran denda sebagai PENDING — WAJIB diverifikasi/disetujui admin
    // terlebih dahulu sebelum dianggap lunas (dan sebelum pengembalian diinspeksi).
    await prisma.payment.create({
      data: {
        amount: amountToPay,
        method: paymentMethod || "TRANSFER",
        status: "PENDING",
        proofImage: proofImage || null,
        orderId: order.id,
      },
    });

    // Update notes to track the fee awaiting verification
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

    // Snapshot rincian denda yang dibayar, dipakai admin saat menyetujui.
    parsedNotes.pendingFee = {
      amount: amountToPay,
      lateFee: effectiveLateFee,
      extensionFee: order.extensionFee || 0,
      damageFee: order.damageFee || 0,
      lossFee: order.lossFee || 0,
      submittedAt: new Date().toISOString(),
    };

    // feeStatus → PENDING_VERIFICATION, dan denda keterlambatan dibekukan (lateFee
    // dipersistkan) agar nilainya tidak bertambah selama menunggu persetujuan.
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        feeStatus: "PENDING_VERIFICATION",
        lateFee: effectiveLateFee,
        notes: JSON.stringify(parsedNotes),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran denda terkirim dan menunggu persetujuan admin.",
      order: updatedOrder,
      paidAmount: amountToPay,
    });
  } catch (error) {
    console.error("Error paying fee:", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran denda" }, { status: 500 });
  }
}

