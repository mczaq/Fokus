import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Map Prisma models to frontend expected shape
    const mapped = equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      category: eq.type,
      brand: eq.brand,
      description: eq.description || "",
      specs: eq.specs || "",
      pricePerDay: eq.pricePerDay,
      originalPrice: eq.originalPrice,
      stock: eq.stock,
      available: eq.available,
      tag: "", // Ignore tag since it's not in Prisma schema natively
      image: eq.image || "",
      isActive: eq.isActive,
      createdAt: eq.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const created = await prisma.equipment.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        brand: data.brand,
        type: data.category,
        specs: data.specs,
        pricePerDay: Number(data.pricePerDay || 0),
        originalPrice: Number(data.originalPrice || 0),
        stock: Number(data.stock || 1),
        available: Number(data.available !== undefined ? data.available : (data.stock || 1)),
        image: data.image,
        isActive: data.isActive,
      },
    });

    const mapped = {
      id: created.id,
      name: created.name,
      category: created.type,
      brand: created.brand,
      description: created.description || "",
      specs: created.specs || "",
      pricePerDay: created.pricePerDay,
      originalPrice: created.originalPrice,
      stock: created.stock,
      available: created.available,
      tag: "",
      image: created.image || "",
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    return NextResponse.json({ error: "Failed to create equipment", details: error.message || String(error) }, { status: 500 });
  }
}
