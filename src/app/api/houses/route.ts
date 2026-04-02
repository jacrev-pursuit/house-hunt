import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const houses = await prisma.house.findMany({
    include: {
      photos: { take: 1, orderBy: { createdAt: "asc" } },
      evaluations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const parents = await prisma.user.findMany({
    where: { role: "parent" },
    include: { priorities: { orderBy: { rank: "asc" } } },
  });

  const safeParents = parents.map(({ passcode: _, ...rest }) => rest);
  return NextResponse.json({ houses, parents: safeParents });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const house = await prisma.house.create({
    data: {
      address: body.address || "",
      neighborhood: body.neighborhood || "",
      price: body.price || 0,
      beds: body.beds || 0,
      baths: body.baths || 0,
      sqft: body.sqft || 0,
      lotAcres: body.lotAcres || 0,
      yearBuilt: body.yearBuilt || 0,
      listingUrl: body.listingUrl || "",
      description: body.description || "",
      tourDate: body.tourDate ? new Date(body.tourDate) : null,
      tourStatus: body.tourStatus || "interested",
      notes: body.notes || "",
    },
  });

  if (body.photoUrls?.length) {
    for (const url of body.photoUrls) {
      await prisma.housePhoto.create({
        data: { houseId: house.id, url, source: "listing", caption: "" },
      });
    }
  }

  return NextResponse.json({ house }, { status: 201 });
}
