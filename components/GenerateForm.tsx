"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/brand";

type Phase = "idle" | "scraping" | "generating";
type PlatformStatus = "pending" | "success" | "failed";

const initialStatus = (): Record<Platform, PlatformStatus> => ({
  instagram: "pending",
  facebook: "pending",
  linkedin: "pending",
});

export function GenerateForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<Record<Platform, PlatformStatus>>(initialStatus);

  const loading = phase !== "idle";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatuses(initialStatus());
    setPhase("scraping");

    let id: string;
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const text = await res.text();
      let data: { id?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        const snippet = text.replace(/\s+/g, " ").slice(0, 200);
        throw new Error(`Scrape failed (HTTP ${res.status}): ${snippet || "empty response"}`);
      }
      if (!res.ok) throw new Error(data.error ?? `Scrape failed (HTTP ${res.status})`);
      if (!data.id) throw new Error("Scrape returned no id");
      id = data.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
      return;
    }

    setPhase("generating");

    await Promise.all(
      PLATFORMS.map(async (platform) => {
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, platform }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `${platform} failed (HTTP ${res.status})`);
          }
          setStatuses((s) => ({ ...s, [platform]: "success" }));
        } catch (err) {
          console.error(`[generate ${platform}]`, err);
          setStatuses((s) => ({ ...s, [platform]: "failed" }));
        }
      }),
    );

    router.push(`/g/${id}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          required
          placeholder="https://buildingreviewjournal.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !url}>
          {phase === "scraping" ? (
            <span className="flex items-center gap-2">
              <Spinner /> Scraping…
            </span>
          ) : phase === "generating" ? (
            <span className="flex items-center gap-2">
              <Spinner /> Generating…
            </span>
          ) : (
            "Generate"
          )}
        </Button>
      </div>

      {phase === "scraping" ? (
        <p className="text-xs text-navy/60">Fetching and parsing the article…</p>
      ) : null}

      {phase === "generating" ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs text-navy/60">
            Calling Claude for all 3 platforms in parallel. This takes ~10–25 seconds per platform.
          </p>
          <ul className="flex flex-col gap-1.5">
            {PLATFORMS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                {statuses[p] === "pending" ? (
                  <Spinner className="text-orange h-4 w-4" />
                ) : statuses[p] === "success" ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                    ✗
                  </span>
                )}
                <span
                  className={
                    statuses[p] === "pending"
                      ? "text-navy/80"
                      : statuses[p] === "success"
                        ? "text-navy"
                        : "text-red-600"
                  }
                >
                  {PLATFORM_LABEL[p]}
                  {statuses[p] === "pending" ? "…" : ""}
                  {statuses[p] === "failed" ? " — failed (you can retry from the post page)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
