import { promises as fs } from "node:fs";
import path from "node:path";
import { put, head, list, del } from "@vercel/blob";
import {
  PLATFORMS,
  type Generation,
  type Platform,
  type PlatformOutput,
} from "./brand";

const DIR = "/tmp/brj";
const BLOB_PREFIX = "brj/";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// --- Key helpers ------------------------------------------------------------

function baseKey(id: string): string {
  return `${BLOB_PREFIX}${id}.json`;
}

function platformKey(id: string, p: Platform): string {
  return `${BLOB_PREFIX}${id}.${p}.json`;
}

function slideKey(id: string, p: Platform, index: number): string {
  return `${BLOB_PREFIX}${id}-${p}-${index}.png`;
}

function basePath(id: string): string {
  return path.join(DIR, `${id}.json`);
}

function platformPath(id: string, p: Platform): string {
  return path.join(DIR, `${id}.${p}.json`);
}

function slidePath(id: string, p: Platform, index: number): string {
  return path.join(DIR, `${id}-${p}-${index}.png`);
}

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

// --- Internal helpers -------------------------------------------------------

type GenerationBase = Omit<Generation, "platforms">;

function stripPlatforms(g: Generation): GenerationBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { platforms, ...rest } = g;
  return rest;
}

async function readJsonBlob<T>(key: string): Promise<T | null> {
  try {
    const meta = await head(key);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readJsonFile<T>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// --- Base generation (URL/title/text, no platforms) -------------------------

async function getBase(id: string): Promise<GenerationBase | null> {
  if (useBlob()) {
    const data = await readJsonBlob<GenerationBase & { platforms?: unknown }>(baseKey(id));
    if (!data) return null;
    return stripPlatforms(data as Generation);
  }
  const data = await readJsonFile<GenerationBase & { platforms?: unknown }>(basePath(id));
  if (!data) return null;
  return stripPlatforms(data as Generation);
}

async function getPlatformOutput(
  id: string,
  p: Platform,
): Promise<PlatformOutput | null> {
  if (useBlob()) {
    return readJsonBlob<PlatformOutput>(platformKey(id, p));
  }
  return readJsonFile<PlatformOutput>(platformPath(id, p));
}

// --- Public API -------------------------------------------------------------

export async function saveGeneration(g: Generation): Promise<void> {
  const base = stripPlatforms(g);
  const body = JSON.stringify(base, null, 2);
  if (useBlob()) {
    await put(baseKey(g.id), body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } else {
    await ensureDir();
    await fs.writeFile(basePath(g.id), body, "utf8");
  }
  // If the caller already attached platform outputs (e.g. migration / restore),
  // persist them to their per-platform files too.
  for (const p of PLATFORMS) {
    const output = g.platforms[p];
    if (output) {
      await writePlatform(g.id, p, output);
    }
  }
}

async function writePlatform(
  id: string,
  p: Platform,
  output: PlatformOutput,
): Promise<void> {
  const body = JSON.stringify(output, null, 2);
  if (useBlob()) {
    await put(platformKey(id, p), body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } else {
    await ensureDir();
    await fs.writeFile(platformPath(id, p), body, "utf8");
  }
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const base = await getBase(id);
  if (!base) return null;
  const [ig, fb, li] = await Promise.all([
    getPlatformOutput(id, "instagram"),
    getPlatformOutput(id, "facebook"),
    getPlatformOutput(id, "linkedin"),
  ]);
  return {
    ...base,
    platforms: {
      ...(ig ? { instagram: ig } : {}),
      ...(fb ? { facebook: fb } : {}),
      ...(li ? { linkedin: li } : {}),
    },
  };
}

export async function updatePlatform(
  id: string,
  platform: Platform,
  output: PlatformOutput,
): Promise<Generation | null> {
  // No read-modify-write of the base file: each platform writes to its own
  // independent key, eliminating the race when 3 platforms run in parallel.
  const base = await getBase(id);
  if (!base) return null;
  await writePlatform(id, platform, output);

  // Invalidate cached slide PNGs for this platform so they re-render with the
  // fresh content.
  if (useBlob()) {
    await Promise.all(
      output.slides.map((_, i) =>
        del(slideKey(id, platform, i)).catch(() => undefined),
      ),
    );
  } else {
    for (let i = 0; i < output.slides.length; i++) {
      await fs.rm(slidePath(id, platform, i), { force: true });
    }
  }

  return {
    ...base,
    platforms: { [platform]: output },
  };
}

export async function listGenerations(): Promise<Generation[]> {
  const PLATFORM_SUFFIXES = PLATFORMS.map((p) => `.${p}.json`);
  const isPlatformPath = (p: string) =>
    PLATFORM_SUFFIXES.some((suffix) => p.endsWith(suffix));

  if (useBlob()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const baseBlobs = blobs.filter(
      (b) => b.pathname.endsWith(".json") && !isPlatformPath(b.pathname),
    );
    const generations = await Promise.all(
      baseBlobs.map(async (b) => {
        // pathname is `brj/<id>.json`
        const m = b.pathname.match(/\/([^/]+)\.json$/);
        if (!m) return null;
        return getGeneration(m[1]);
      }),
    );
    return generations
      .filter((g): g is Generation => g !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  await ensureDir();
  const entries = await fs.readdir(DIR);
  const baseFiles = entries.filter(
    (n) => n.endsWith(".json") && !isPlatformPath(n),
  );
  const generations = await Promise.all(
    baseFiles.map(async (n) => {
      const id = n.replace(/\.json$/, "");
      return getGeneration(id);
    }),
  );
  return generations
    .filter((g): g is Generation => g !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// --- Slide PNG cache --------------------------------------------------------

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
