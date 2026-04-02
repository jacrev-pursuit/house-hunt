import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const offers = await prisma.offer.findMany({
    where: { houseId: id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ offers });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: houseId } = await params;
  const body = await request.json();

  const offer = await prisma.offer.create({
    data: {
      houseId,
      amount: body.amount || 0,
      type: body.type || "initial",
      notes: body.notes || "",
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  if (body.type === "initial" || body.type === "counter_sent") {
    await prisma.house.update({
      where: { id: houseId },
      data: { tourStatus: "offer_made" },
    });
  } else if (body.type === "accepted") {
    await prisma.house.update({
      where: { id: houseId },
      data: { tourStatus: "under_contract" },
    });
  } else if (body.type === "rejected") {
    await prisma.house.update({
      where: { id: houseId },
      data: { tourStatus: "rejected" },
    });
  } else if (body.type === "withdrawn") {
    await prisma.house.update({
      where: { id: houseId },
      data: { tourStatus: "withdrawn" },
    });
  }

  return NextResponse.json({ offer }, { status: 201 });
}
