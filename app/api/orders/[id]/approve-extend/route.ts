import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json(); // "APPROVED" or "REJECTED"

    let order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        items: {
          include: { equipment: true }
        }
      }
    });

    if (!order) {
      const studioBooking = await prisma.studioBooking.findUnique({
        where: { id: id },
        include: { studio: true }
      });

      if (studioBooking) {
        if (status === "REJECTED") {
          const updatedBooking = await prisma.studioBooking.update({
            where: { id: studioBooking.id },
            data: {
              extensionRequestStatus: "REJECTED",
              extensionRequestHours: 0
            }
          });
          return NextResponse.json({ success: true, order: updatedBooking });
        }
        
        if (status === "APPROVED") {
          const hoursToAdd = studioBooking.extensionRequestHours || 0;
          if (hoursToAdd < 1) return NextResponse.json({ error: "Durasi tidak valid" }, { status: 400 });

          const extraCost = (studioBooking.studio?.pricePerHour || 0) * hoursToAdd;
          
          // Simply update the duration, end time strings can be complex to parse, so we just add to extensionFee
          const updatedBooking = await prisma.studioBooking.update({
            where: { id: studioBooking.id },
            data: {
              extensionFee: studioBooking.extensionFee + extraCost,
              feeStatus: "UNPAID",
              extensionRequestStatus: "APPROVED",
              duration: studioBooking.duration + hoursToAdd
            }
          });
          return NextResponse.json({ success: true, order: updatedBooking });
        }
      }

      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (status === "REJECTED") {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          extensionRequestStatus: "REJECTED",
          extensionRequestDays: 0
        }
      });
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (status === "APPROVED") {
      const daysToAdd = order.extensionRequestDays || 0;
      if (daysToAdd < 1) {
         return NextResponse.json({ error: "Durasi perpanjangan tidak valid" }, { status: 400 });
      }

      // Calculate extra cost
      let extraCost = 0;
      order.items.forEach((item) => {
        const dailyPrice = item.equipment?.pricePerDay || item.price || 0;
        extraCost += dailyPrice * item.quantity * daysToAdd;
      });

      const currentEndDate = order.endDate ? new Date(order.endDate) : new Date();
      const newEndDate = new Date(currentEndDate.getTime() + daysToAdd * 86400000);

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          endDate: newEndDate,
          extensionFee: order.extensionFee + extraCost,
          feeStatus: "UNPAID",
          status: "ACTIVE",
          extensionRequestStatus: "APPROVED"
        }
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }
    
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

  } catch (error) {
    console.error("Error approving extension:", error);
    return NextResponse.json({ error: "Gagal memproses pengajuan" }, { status: 500 });
  }
}
