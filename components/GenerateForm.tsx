"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/brand";

type Phase = "idle" | "scraping" | "generating";

export function GenerateForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState<Platform[]>([]);

  const loading = phase !== "idle";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFailed([]);
    setPhase("scraping");

    let id: string;
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      id = data.id as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
      return;
    }

    setPhase("generating");

    const results = await Promise.allSettled(
      PLATFORMS.map(async (platform) => {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, platform }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `${platform} failed`);
        }
        return platform;
      }),
    );

    const failedPlatforms = results
      .map((r, i) => (r.status === "rejected" ? PLATFORMS[i] : null))
      .filter((p): p is Platform => p !== null);

    setFailed(failedPlatforms);
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
          {phase === "scraping"
            ? "Scraping…"
            : phase === "generating"
              ? "Generating…"
              : "Generate"}
        </Button>
      </div>
      {phase === "generating" ? (
        <p className="text-xs text-navy/60">
          Calling Claude for {PLATFORMS.map((p) => PLATFORM_LABEL[p]).join(", ")} in parallel. This usually takes 10–25 seconds.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {failed.length > 0 ? (
        <p className="text-sm text-amber-600">
          Some platforms failed: {failed.map((p) => PLATFORM_LABEL[p]).join(", ")}. You can re-run them from the post page.
        </p>
      ) : null}
    </form>
  );
}
