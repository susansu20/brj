import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { saveGeneration } from "@/lib/storage";
import { safeId } from "@/lib/utils";
import type { Generation } from "@/lib/brand";

export const runtime = "nodejs";

const MAX_TEXT = 8_000;

function absUrl(maybeUrl: string | null | undefined, base: string): string | null {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return null;
  }
}

function extractHero(dom: JSDOM, base: string): { src: string | null; alt: string | null } {
  const doc = dom.window.document;
  const og =
    doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
  const ogAlt =
    doc.querySelector('meta[property="og:image:alt"]')?.getAttribute("content") ?? null;
  if (og) return { src: absUrl(og, base), alt: ogAlt };
  const firstImg = doc.querySelector("article img, main img, img");
  if (firstImg) {
    return {
      src: absUrl(firstImg.getAttribute("src"), base),
      alt: firstImg.getAttribute("alt"),
    };
  }
  return { src: null, alt: null };
}

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) return NextResponse.json({ error: "url is required" }, { status: 400 });

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!/^https?:$/.test(url.protocol)) {
    return NextResponse.json({ error: "URL must be http(s)" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BRJSocialBot/0.1; +https://buildingreviewjournal.com)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `Fetch error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const dom = new JSDOM(html, { url: url.toString() });
  const article = new Readability(dom.window.document).parse();
  if (!article || !article.textContent) {
    return NextResponse.json({ error: "Could not extract article text" }, { status: 422 });
  }

  const hero = extractHero(dom, url.toString());
  const cleanText = article.textContent.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);

  const generation: Generation = {
    id: safeId(),
    url: url.toString(),
    title: (article.title ?? dom.window.document.title ?? "Untitled").trim(),
    author: article.byline ? article.byline.trim() : null,
    heroImage: hero.src,
    heroImageAlt: hero.alt,
    excerpt: article.excerpt ? article.excerpt.trim() : null,
    text: cleanText,
    createdAt: Date.now(),
    platforms: {},
  };

  await saveGeneration(generation);

  return NextResponse.json({ id: generation.id });
}
