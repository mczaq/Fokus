import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { sendOrderNotificationEmail, sendBookingNotificationEmail } from "@/app/lib/email";
import { syncEquipmentStock } from "@/app/lib/equipmentStock";

/**
 * Admin verification of a customer payment.
 * Body: { action: "ACCEPT" | "REJECT" | "REFUND" }
 *
 * ACCEPT  -> payment CONFIRMED, order -> PROCESSING / booking -> CONFIRMED
 * REJECT  -> payment REJECTED,  order/booking -> PENDING (customer can pay again)
 * REFUND  -> payment REFUNDED,  order/booking -> CANCELLED
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true, booking: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
    }

    const act = String(action || "").toUpperCase();
    let newStatus: "CONFIRMED" | "REJECTED" | "REFUNDED";
    if (act === "ACCEPT" || act === "CONFIRM" || act === "CONFIRMED") newStatus = "CONFIRMED";
    else if (act === "REJECT" || act === "REJECTED") newStatus = "REJECTED";
    else if (act === "REFUND" || act === "REFUNDED") newStatus = "REFUNDED";
    else {
      return NextResponse.json(
        { error: "Aksi verifikasi tidak valid. Gunakan ACCEPT, REJECT, atau REFUND." },
        { status: 400 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        confirmedAt: newStatus === "CONFIRMED" ? new Date() : payment.confirmedAt,
      },
    });

    // Cascade to the related order
    if (payment.orderId && payment.order) {
      const ord = payment.order;
      // Bedakan pembayaran DENDA/biaya tambahan dari pembayaran POKOK:
      // pembayaran pokok hanya ada saat order masih PENDING. Jika order sudah
      // melewati PENDING (ACTIVE/OVERDUE/PROCESSING/COMPLETED), ini pembayaran denda.
      const isFeePayment = ord.status !== "PENDING";

      if (isFeePayment) {
        let parsed: any = {};
        try {
          if (ord.notes && ord.notes.trim().startsWith("{")) parsed = JSON.parse(ord.notes);
          else if (ord.notes) parsed = { userNotes: ord.notes };
        } catch {
          parsed = {};
        }
        const pendingFee = parsed.pendingFee || {};

        if (newStatus === "CONFIRMED") {
          // Denda disetujui → tandai LUNAS & finalkan nilainya. Status order TIDAK diubah.
          parsed.paidFeeDetails = {
            lateFee: Number(pendingFee.lateFee ?? ord.lateFee ?? 0),
            extensionFee: Number(pendingFee.extensionFee ?? ord.extensionFee ?? 0),
            damageFee: Number(pendingFee.damageFee ?? ord.damageFee ?? 0),
            lossFee: Number(pendingFee.lossFee ?? ord.lossFee ?? 0),
          };
          delete parsed.pendingFee;
          await prisma.order.update({
            where: { id: ord.id },
            data: {
              feeStatus: "PAID",
              lateFee: Number(pendingFee.lateFee ?? ord.lateFee ?? 0),
              totalAmount: ord.totalAmount + payment.amount,
              notes: JSON.stringify(parsed),
            },
          });
        } else if (newStatus === "REJECTED") {
          // Denda ditolak → pelanggan harus bayar ulang (denda keterlambatan berjalan lagi).
          delete parsed.pendingFee;
          await prisma.order.update({
            where: { id: ord.id },
            data: { feeStatus: "UNPAID", notes: JSON.stringify(parsed) },
          });
        } else if (newStatus === "REFUNDED") {
          await prisma.order.update({
            where: { id: ord.id },
            data: { feeStatus: "UNPAID" },
          });
        }
      } else {
        // Pembayaran POKOK (order masih menunggu pembayaran) — perilaku lama.
        const orderStatus =
          newStatus === "CONFIRMED" ? "PROCESSING" :
          newStatus === "REFUNDED" ? "CANCELLED" :
          "PENDING"; // REJECTED -> back to awaiting payment

        await prisma.order.update({
          where: { id: ord.id },
          data: {
            status: orderStatus,
            ...(newStatus === "CONFIRMED" ? { agreementAccepted: true } : {}),
          },
        });

        try {
          await syncEquipmentStock();
        } catch (e) {
          console.error("Stock sync after payment verification failed:", e);
        }

        if (newStatus === "CONFIRMED") {
          try {
            const user = await prisma.user.findUnique({
              where: { id: ord.userId },
              select: { email: true },
            });
            if (user?.email) {
              const fullOrder = await prisma.order.findUnique({
                where: { id: ord.id },
                include: {
                  items: {
                    include: {
                      equipment: { select: { name: true } },
                      service: { select: { name: true } },
                    },
                  },
                },
              });
              await sendOrderNotificationEmail(fullOrder, user.email);
            }
          } catch (e) {
            console.error("Verification email (order) failed:", e);
          }
        }
      }
    }

    // Cascade to the related booking
    if (payment.bookingId) {
      const bookingStatus =
        newStatus === "CONFIRMED" ? "CONFIRMED" :
        newStatus === "REFUNDED" ? "CANCELLED" :
        "PENDING"; // REJECTED -> back to awaiting payment

      await prisma.studioBooking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      });

      if (newStatus === "CONFIRMED" && payment.booking) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: payment.booking.userId },
            select: { email: true },
          });
          if (user?.email) {
            const fullBooking = await prisma.studioBooking.findUnique({
              where: { id: payment.bookingId },
              include: { studio: { select: { name: true } } },
            });
            await sendBookingNotificationEmail(fullBooking, user.email);
          }
        } catch (e) {
          console.error("Verification email (booking) failed:", e);
        }
      }
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Gagal memverifikasi pembayaran." }, { status: 500 });
  }
}
