"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function GenerateForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
      // Redirect immediately. The post page will auto-fire generation for all
      // three platforms in parallel with live per-tab spinners.
      router.push(`/g/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
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
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Scraping…
            </span>
          ) : (
            "Generate"
          )}
        </Button>
      </div>
      {loading ? (
        <p className="text-xs text-navy/60">
          Fetching and parsing the article. You&apos;ll be redirected to the post page where all three platforms generate in parallel.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
    </form>
  );
}
