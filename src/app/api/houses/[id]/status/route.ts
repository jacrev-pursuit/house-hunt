import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { tourStatus, tourDate } = await request.json();

  const data: Record<string, unknown> = {};
  if (tourStatus) data.tourStatus = tourStatus;
  if (tourDate !== undefined) data.tourDate = tourDate ? new Date(tourDate) : null;

  const house = await prisma.house.update({
    where: { id },
    data,
  });

  return NextResponse.json({ house });
}
