import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parents = await prisma.user.findMany({
    where: { role: "parent" },
    include: { priorities: { orderBy: { rank: "asc" } } },
  });

  const safeParents = parents.map(({ passcode: _, ...rest }) => rest);
  return NextResponse.json({ parents: safeParents, currentUserId: session.id });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, category } = await request.json();
  const maxRank = await prisma.priority.count({ where: { userId: session.id } });

  const priority = await prisma.priority.create({
    data: {
      userId: session.id,
      name,
      category: category || "nice_to_have",
      rank: maxRank + 1,
    },
  });

  return NextResponse.json({ priority }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { priorities } = await request.json();

  for (const p of priorities) {
    if (p.userId !== session.id) continue;
    await prisma.priority.update({
      where: { id: p.id },
      data: { rank: p.rank, category: p.category, name: p.name },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await request.json();
  const priority = await prisma.priority.findUnique({ where: { id } });
  if (!priority || priority.userId !== session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.priority.delete({ where: { id } });

  // Rerank remaining
  const remaining = await prisma.priority.findMany({
    where: { userId: session.id },
    orderBy: { rank: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    await prisma.priority.update({
      where: { id: remaining[i].id },
      data: { rank: i + 1 },
    });
  }

  return NextResponse.json({ ok: true });
}
