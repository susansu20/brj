import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { SIZE, type Platform, type Slide } from "./brand";
import { Editorial } from "./templates/Editorial";
import { Quote } from "./templates/Quote";
import { loadFonts } from "./fonts";
import { getLogoDataUrl } from "./logo";
import { getCachedSlide, putCachedSlide } from "./storage";

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

  const slide = slides[index];
  if (!slide) throw new Error(`Slide index ${index} out of range`);
  const { width, height } = SIZE[platform];
  const [fonts, logoDataUrl] = await Promise.all([loadFonts(), getLogoDataUrl()]);

  const element = pickTemplate(slide, width, height, index, slides.length, logoDataUrl);
  const svg = await satori(element as React.ReactNode, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  await putCachedSlide(id, platform, index, png);
  return png;
}
