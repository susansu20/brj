import { promises as fs } from "node:fs";
import path from "node:path";
import type { Generation, Platform, PlatformOutput } from "./brand";

const DIR = "/tmp/brj";

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function file(id: string) {
  return path.join(DIR, `${id}.json`);
}

export function slidePath(id: string, platform: Platform, index: number) {
  return path.join(DIR, `${id}-${platform}-${index}.png`);
}

export async function saveGeneration(g: Generation): Promise<void> {
  await ensureDir();
  await fs.writeFile(file(g.id), JSON.stringify(g, null, 2), "utf8");
}

export async function getGeneration(id: string): Promise<Generation | null> {
  try {
    const raw = await fs.readFile(file(id), "utf8");
    return JSON.parse(raw) as Generation;
  } catch {
    return null;
  }
}

export async function updatePlatform(
  id: string,
  platform: Platform,
  output: PlatformOutput,
): Promise<Generation | null> {
  const g = await getGeneration(id);
  if (!g) return null;
  g.platforms[platform] = output;
  await saveGeneration(g);
  // Invalidate cached slide PNGs for this platform.
  for (let i = 0; i < output.slides.length; i++) {
    await fs.rm(slidePath(id, platform, i), { force: true });
  }
  return g;
}

export async function listGenerations(): Promise<Generation[]> {
  await ensureDir();
  const entries = await fs.readdir(DIR);
  const out: Generation[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DIR, name), "utf8");
      out.push(JSON.parse(raw) as Generation);
    } catch {
      // skip
    }
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}
