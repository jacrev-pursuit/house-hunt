import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: houseId } = await params;
  const { text, sentiment } = await request.json();

  const note = await prisma.houseNote.create({
    data: {
      houseId,
      userId: session.id,
      text,
      sentiment: sentiment || "neutral",
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
