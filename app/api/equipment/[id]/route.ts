import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    console.log("PUT /api/equipment/[id] request data:", data);

    const existing = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        brand: data.brand !== undefined ? data.brand : existing.brand,
        type: data.category !== undefined ? data.category : existing.type,
        specs: data.specs !== undefined ? data.specs : existing.specs,
        pricePerDay: data.pricePerDay !== undefined ? Number(data.pricePerDay) : existing.pricePerDay,
        originalPrice: data.originalPrice !== undefined ? Number(data.originalPrice) : existing.originalPrice,
        stock: data.stock !== undefined ? Number(data.stock) : existing.stock,
        available: data.available !== undefined ? Number(data.available) : existing.available,
        image: data.image !== undefined ? data.image : existing.image,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    const mapped = {
      id: updated.id,
      name: updated.name,
      category: updated.type,
      brand: updated.brand,
      description: updated.description || "",
      specs: updated.specs || "",
      pricePerDay: updated.pricePerDay,
      originalPrice: updated.originalPrice,
      stock: updated.stock,
      available: updated.available,
      tag: "",
      image: updated.image || "",
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Failed to update equipment", details: error.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Check references in OrderItem
    const hasReferences = await prisma.orderItem.findFirst({
      where: { equipmentId: id },
    });

    if (hasReferences) {
      // Just make it inactive instead of hard deleting to prevent DB crash due to FK constraints
      await prisma.equipment.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Equipment contains active bookings. Marked as inactive instead of deleting." });
    }

    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
