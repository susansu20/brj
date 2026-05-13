import { NextResponse } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { buildPrompt } from "@/lib/prompts";
import { getGeneration, updatePlatform } from "@/lib/storage";
import { extractJson } from "@/lib/utils";
import {
  PLATFORMS,
  type Platform,
  type PlatformOutput,
  type Slide,
  type Treatment,
} from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 60;

const TREATMENTS: Treatment[] = ["hero", "quote", "stat", "cta"];

function coerceOutput(raw: unknown): PlatformOutput {
  if (!raw || typeof raw !== "object") throw new Error("Model response was not a JSON object");
  const obj = raw as Record<string, unknown>;
  const caption = typeof obj.caption === "string" ? obj.caption.trim() : "";
  if (!caption) throw new Error("Missing caption");
  const hashtagsRaw = Array.isArray(obj.hashtags) ? obj.hashtags : [];
  const hashtags = hashtagsRaw
    .map((h) => (typeof h === "string" ? h.replace(/^#/, "").trim() : ""))
    .filter(Boolean);
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
  if (slidesRaw.length < 6) throw new Error(`Expected 6 slides, got ${slidesRaw.length}`);
  const slides: Slide[] = slidesRaw.slice(0, 6).map((s, i) => {
    if (!s || typeof s !== "object") throw new Error(`Slide ${i} is not an object`);
    const so = s as Record<string, unknown>;
    const headline = typeof so.headline === "string" ? so.headline.trim() : "";
    const body = typeof so.body === "string" ? so.body.trim() : "";
    const treatmentRaw = typeof so.treatment === "string" ? so.treatment.trim().toLowerCase() : "";
    const treatment: Treatment = (TREATMENTS as string[]).includes(treatmentRaw)
      ? (treatmentRaw as Treatment)
      : i === 0
        ? "hero"
        : i === 5
          ? "cta"
          : "hero";
    if (!headline) throw new Error(`Slide ${i} missing headline`);
    return { headline, body, treatment };
  });
  return { caption, hashtags, slides };
}

export async function POST(req: Request) {
  let body: { id?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, platform } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!platform || !(PLATFORMS as string[]).includes(platform)) {
    return NextResponse.json({ error: "platform must be instagram|facebook|linkedin" }, { status: 400 });
  }
  const p = platform as Platform;

  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: "Generation not found" }, { status: 404 });

  const prompt = buildPrompt(p, {
    title: generation.title,
    text: generation.text,
    heroImageDescription: generation.heroImageAlt ?? "",
  });

  let text: string;
  try {
    const message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    const block = message.content.find((b) => b.type === "text");
    text = block && block.type === "text" ? block.text : "";
  } catch (err) {
    return NextResponse.json(
      { error: `Anthropic error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  if (!text) return NextResponse.json({ error: "Empty model response" }, { status: 502 });

  let output: PlatformOutput;
  try {
    output = coerceOutput(extractJson(text));
  } catch (err) {
    return NextResponse.json(
      { error: `Could not parse model output: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const updated = await updatePlatform(id, p, output);
  if (!updated) return NextResponse.json({ error: "Generation disappeared" }, { status: 404 });

  return NextResponse.json({ id, platform: output });
}
