import { promises as fs } from "node:fs";
import path from "node:path";
import { put, head, list, del } from "@vercel/blob";
import type { Generation, Platform, PlatformOutput } from "./brand";

const DIR = "/tmp/brj";
const BLOB_PREFIX = "brj/";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function jsonKey(id: string): string {
  return `${BLOB_PREFIX}${id}.json`;
}

function slideKey(id: string, platform: Platform, index: number): string {
  return `${BLOB_PREFIX}${id}-${platform}-${index}.png`;
}

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function jsonPath(id: string): string {
  return path.join(DIR, `${id}.json`);
}

function slidePath(id: string, platform: Platform, index: number): string {
  return path.join(DIR, `${id}-${platform}-${index}.png`);
}

export async function saveGeneration(g: Generation): Promise<void> {
  const body = JSON.stringify(g, null, 2);
  if (useBlob()) {
    await put(jsonKey(g.id), body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await ensureDir();
  await fs.writeFile(jsonPath(g.id), body, "utf8");
}

export async function getGeneration(id: string): Promise<Generation | null> {
  if (useBlob()) {
    try {
      const meta = await head(jsonKey(id));
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as Generation;
    } catch {
      return null;
    }
  }
  try {
    const raw = await fs.readFile(jsonPath(id), "utf8");
    return JSON.parse(raw) as Generation;
  } catch {
    return null;
  }
}

export async function listGenerations(): Promise<Generation[]> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const jsonBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));
    const settled = await Promise.all(
      jsonBlobs.map(async (b) => {
        try {
          const res = await fetch(b.url, { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as Generation;
        } catch {
          return null;
        }
      }),
    );
    return settled
      .filter((x): x is Generation => x !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

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

export async function updatePlatform(
  id: string,
  platform: Platform,
  output: PlatformOutput,
): Promise<Generation | null> {
  const g = await getGeneration(id);
  if (!g) return null;
  g.platforms[platform] = output;
  await saveGeneration(g);

  // Invalidate cached slide PNGs for this platform so they re-render with new content.
  if (useBlob()) {
    await Promise.all(
      output.slides.map((_, i) =>
        del(slideKey(g.id, platform, i)).catch(() => undefined),
      ),
    );
  } else {
    for (let i = 0; i < output.slides.length; i++) {
      await fs.rm(slidePath(g.id, platform, i), { force: true });
    }
  }
  return g;
}

export async function getCachedSlide(
  id: string,
  platform: Platform,
  index: number,
): Promise<Buffer | null> {
  if (useBlob()) {
    try {
      const meta = await head(slideKey(id, platform, index));
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(slidePath(id, platform, index));
  } catch {
    return null;
  }
}

export async function putCachedSlide(
  id: string,
  platform: Platform,
  index: number,
  png: Buffer,
): Promise<void> {
  if (useBlob()) {
    await put(slideKey(id, platform, index), png, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await ensureDir();
  await fs.writeFile(slidePath(id, platform, index), png);
}
