import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: houseId } = await params;
  const { url, caption, source, mediaType } = await request.json();

  const photo = await prisma.housePhoto.create({
    data: {
      houseId,
      url,
      mediaType: mediaType || "image",
      source: source || "upload",
      caption: caption || "",
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await params;
  const { photoId } = await request.json();
  await prisma.housePhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
