import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { saveGeneration } from "@/lib/storage";
import { safeId } from "@/lib/utils";
import type { Generation } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TEXT = 8_000;

function jsonError(error: string, status: number): Response {
  console.error(`[scrape] ${status} ${error}`);
  return NextResponse.json({ error }, { status });
}

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
  try {
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const rawUrl = (body.url ?? "").trim();
    if (!rawUrl) return jsonError("url is required", 400);

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return jsonError("Invalid URL", 400);
    }
    if (!/^https?:$/.test(url.protocol)) {
      return jsonError("URL must be http(s)", 400);
    }

    console.log(`[scrape] fetching ${url.toString()}`);

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
      if (!res.ok) return jsonError(`Fetch failed: ${res.status} ${res.statusText}`, 502);
      html = await res.text();
    } catch (err) {
      return jsonError(
        `Fetch error: ${err instanceof Error ? err.message : String(err)}`,
        502,
      );
    }

    console.log(`[scrape] fetched ${html.length} bytes, parsing`);

    let title = "Untitled";
    let author: string | null = null;
    let excerpt: string | null = null;
    let textContent = "";
    let heroSrc: string | null = null;
    let heroAlt: string | null = null;

    try {
      const dom = new JSDOM(html, { url: url.toString() });
      const article = new Readability(dom.window.document).parse();
      if (!article || !article.textContent) {
        return jsonError("Could not extract article text", 422);
      }
      title = (article.title ?? dom.window.document.title ?? "Untitled").trim();
      author = article.byline ? article.byline.trim() : null;
      excerpt = article.excerpt ? article.excerpt.trim() : null;
      textContent = article.textContent.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
      const hero = extractHero(dom, url.toString());
      heroSrc = hero.src;
      heroAlt = hero.alt;
    } catch (err) {
      return jsonError(
        `Parse error: ${err instanceof Error ? err.message : String(err)}`,
        500,
      );
    }

    const generation: Generation = {
      id: safeId(),
      url: url.toString(),
      title,
      author,
      heroImage: heroSrc,
      heroImageAlt: heroAlt,
      excerpt,
      text: textContent,
      createdAt: Date.now(),
      platforms: {},
    };

    try {
      await saveGeneration(generation);
    } catch (err) {
      return jsonError(
        `Storage error: ${err instanceof Error ? err.message : String(err)}`,
        500,
      );
    }

    console.log(`[scrape] saved ${generation.id} (${title})`);
    return NextResponse.json({ id: generation.id });
  } catch (err) {
    return jsonError(
      `Unexpected: ${err instanceof Error ? err.message : String(err)}`,
      500,
    );
  }
}
