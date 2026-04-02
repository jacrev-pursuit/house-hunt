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
  const { evaluations } = await request.json();

  for (const ev of evaluations) {
    await prisma.houseEvaluation.upsert({
      where: {
        houseId_priorityId: {
          houseId,
          priorityId: ev.priorityId,
        },
      },
      create: {
        houseId,
        userId: session.id,
        priorityId: ev.priorityId,
        met: ev.met,
        notes: ev.notes || "",
      },
      update: {
        met: ev.met,
        notes: ev.notes || "",
        userId: session.id,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
