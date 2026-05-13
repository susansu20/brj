import { promises as fs } from "node:fs";
import path from "node:path";

const FONT_DIR = "/tmp/brj/fonts";

const SOURCES = {
  regular:
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
  bold:
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
  extrabold:
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf",
} as const;

type Weight = keyof typeof SOURCES;

const memCache: Partial<Record<Weight, Buffer>> = {};

async function load(weight: Weight): Promise<Buffer> {
  if (memCache[weight]) return memCache[weight]!;
  await fs.mkdir(FONT_DIR, { recursive: true });
  const filePath = path.join(FONT_DIR, `inter-${weight}.ttf`);
  try {
    const buf = await fs.readFile(filePath);
    memCache[weight] = buf;
    return buf;
  } catch {
    // download
  }
  const res = await fetch(SOURCES[weight]);
  if (!res.ok) {
    throw new Error(`Font fetch failed (${weight}): ${res.status} ${res.statusText}`);
  }
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  await fs.writeFile(filePath, buf);
  memCache[weight] = buf;
  return buf;
}

export interface SatoriFont {
  name: string;
  data: Buffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

export async function loadFonts(): Promise<SatoriFont[]> {
  const [regular, bold, extrabold] = await Promise.all([
    load("regular"),
    load("bold"),
    load("extrabold"),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
    { name: "Inter", data: extrabold, weight: 800, style: "normal" },
  ];
}
