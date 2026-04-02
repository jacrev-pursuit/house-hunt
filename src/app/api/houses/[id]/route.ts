import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const house = await prisma.house.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "asc" } },
      evaluations: true,
      houseNotes: { include: { user: true }, orderBy: { createdAt: "desc" } },
      offers: { orderBy: { date: "desc" } },
    },
  });

  if (!house) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parents = await prisma.user.findMany({
    where: { role: "parent" },
    include: { priorities: { orderBy: { rank: "asc" } } },
  });

  const safeParents = parents.map(({ passcode: _, ...rest }) => rest);
  return NextResponse.json({ house, parents: safeParents });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const house = await prisma.house.update({
    where: { id },
    data: {
      address: body.address,
      neighborhood: body.neighborhood,
      price: body.price,
      beds: body.beds,
      baths: body.baths,
      sqft: body.sqft,
      lotAcres: body.lotAcres,
      yearBuilt: body.yearBuilt,
      listingUrl: body.listingUrl,
      description: body.description,
      tourDate: body.tourDate ? new Date(body.tourDate) : null,
      tourStatus: body.tourStatus,
      notes: body.notes,
    },
  });

  return NextResponse.json({ house });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.house.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
