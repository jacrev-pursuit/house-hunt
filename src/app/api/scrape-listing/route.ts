import { NextRequest, NextResponse } from "next/server";
import { scrapeListing } from "@/lib/scrape-listing";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const data = await scrapeListing(url);
  if (!data) {
    return NextResponse.json(
      { error: "Could not extract any data from this URL." },
      { status: 422 }
    );
  }

  // Even partial data is useful — the address from the URL alone helps
  const hasRichData = data.price > 0 || data.beds > 0;
  return NextResponse.json({
    ...data,
    _partial: !hasRichData,
    _hint: hasRichData
      ? undefined
      : "Got the address from the URL. Full details couldn't be loaded — fill in the rest manually.",
  });
}
