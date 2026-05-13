import { NextResponse } from "next/server";
import { getGeneration } from "@/lib/storage";
import { renderSlidePng } from "@/lib/slideRender";
import { PLATFORMS, type Platform } from "@/lib/brand";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const platform = searchParams.get("platform");
  const indexStr = searchParams.get("index");

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!platform || !(PLATFORMS as string[]).includes(platform)) {
    return NextResponse.json({ error: "platform invalid" }, { status: 400 });
  }
  const index = Number(indexStr);
  if (!Number.isInteger(index) || index < 0 || index > 5) {
    return NextResponse.json({ error: "index must be 0..5" }, { status: 400 });
  }

  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: "Generation not found" }, { status: 404 });

  const out = generation.platforms[platform as Platform];
  if (!out) {
    return NextResponse.json(
      { error: `No ${platform} output yet. Generate first.` },
      { status: 404 },
    );
  }

  try {
    const png = await renderSlidePng(id, platform as Platform, index, out.slides);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Render error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
