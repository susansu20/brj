import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getGeneration } from "@/lib/storage";
import { renderSlidePng } from "@/lib/slideRender";
import { PLATFORMS, SIZE, type Platform } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const platform = searchParams.get("platform");

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!platform || !(PLATFORMS as string[]).includes(platform)) {
    return NextResponse.json({ error: "platform invalid" }, { status: 400 });
  }
  const p = platform as Platform;

  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: "Generation not found" }, { status: 404 });

  const out = generation.platforms[p];
  if (!out) {
    return NextResponse.json({ error: `No ${platform} output yet` }, { status: 404 });
  }

  try {
    const pngs = await Promise.all(
      out.slides.map((_, i) => renderSlidePng(id, p, i, out.slides)),
    );

    const { width, height } = SIZE[p];
    const pdf = await PDFDocument.create();
    pdf.setTitle(generation.title);
    pdf.setAuthor("Building Review Journal");
    pdf.setSubject(`${generation.title} — ${platform}`);

    for (const png of pngs) {
      const image = await pdf.embedPng(png);
      const page = pdf.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    }

    const bytes = await pdf.save();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="brj-${id}-${platform}.pdf"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `PDF error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
