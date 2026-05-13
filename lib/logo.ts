import { promises as fs } from "node:fs";
import path from "node:path";

let cached: string | null = null;

export async function getLogoDataUrl(): Promise<string> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "public", "brj-logo.png");
  const buf = await fs.readFile(filePath);
  cached = `data:image/png;base64,${buf.toString("base64")}`;
  return cached;
}

export const LOGO_ASPECT = 600 / 140; // ~4.286
