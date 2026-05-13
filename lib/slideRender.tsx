import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { SIZE, type Platform, type Slide } from "./brand";
import { Editorial } from "./templates/Editorial";
import { Quote } from "./templates/Quote";
import { loadFonts } from "./fonts";
import { getLogoDataUrl } from "./logo";
import { getCachedSlide, putCachedSlide } from "./storage";

// Strip characters that the loaded Latin Inter font cannot render.
// Satori throws when asked to lay out a glyph that doesn't exist in
// any provided font (emoji, CJK, dingbats, etc.). We replace them with
// a space and collapse runs of whitespace.
function sanitize(text: string): string {
  return text
    // Supplementary planes: emoji (U+1F300–U+1FAFF, etc.)
    .replace(/[\u{10000}-\u{10FFFF}]/gu, " ")
    // BMP dingbats and misc symbols often used as emoji-ish
    .replace(/[☀-➿]/g, " ")
    // Variation selectors (e.g. VS16 that makes things emoji-presentation)
    .replace(/[︀-️]/g, "")
    // Zero-width joiners and similar
    .replace(/[​-‍⁠]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSlide(slide: Slide): Slide {
  return {
    ...slide,
    headline: sanitize(slide.headline),
    body: sanitize(slide.body),
  };
}

function pickTemplate(
  slide: Slide,
  width: number,
  height: number,
  index: number,
  total: number,
  logoDataUrl: string,
) {
  if (slide.treatment === "quote" || slide.treatment === "stat") {
    return Quote({ slide, width, height, index, total, logoDataUrl });
  }
  return Editorial({ slide, width, height, index, total, logoDataUrl });
}

export async function renderSlidePng(
  id: string,
  platform: Platform,
  index: number,
  slides: Slide[],
): Promise<Buffer> {
  const cached = await getCachedSlide(id, platform, index);
  if (cached) return cached;

  const raw = slides[index];
  if (!raw) throw new Error(`Slide index ${index} out of range`);
  const slide = sanitizeSlide(raw);
  const { width, height } = SIZE[platform];
  const [fonts, logoDataUrl] = await Promise.all([loadFonts(), getLogoDataUrl()]);

  const element = pickTemplate(slide, width, height, index, slides.length, logoDataUrl);
  const svg = await satori(element as React.ReactNode, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  await putCachedSlide(id, platform, index, png);
  return png;
}
