import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { currentUser } from "@clerk/nextjs/server";
import { isBlobUrl } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url");
  if (!url || !isBlobUrl(url)) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "blob not configured" }, { status: 500 });
  }

  try {
    const result = await get(url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return new Response(result.stream, {
      status: 200,
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "cache-control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[blob-proxy]", err);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
