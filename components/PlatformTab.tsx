"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { SlideGrid } from "@/components/SlideGrid";
import { PLATFORM_LABEL, type Platform, type PlatformOutput } from "@/lib/brand";

function composeCaption(output: PlatformOutput): string {
  const hashtags = output.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return hashtags ? `${output.caption.trim()}\n\n${hashtags}` : output.caption.trim();
}

export function PlatformTab({
  id,
  platform,
  output,
}: {
  id: string;
  platform: Platform;
  output: PlatformOutput | undefined;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState(output ? composeCaption(output) : "");
  const [version, setVersion] = useState(() => Date.now());

  async function regenerate() {
    if (loading) return; // ignore double-clicks
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, platform }),
      });
      const text = await res.text();
      let data: { platform?: PlatformOutput; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        const snippet = text.replace(/\s+/g, " ").slice(0, 200);
        throw new Error(`Generation failed (HTTP ${res.status}): ${snippet || "empty response"}`);
      }
      if (!res.ok) throw new Error(data.error ?? `Generation failed (HTTP ${res.status})`);
      if (!data.platform) throw new Error("Generation returned no platform payload");
      setCaption(composeCaption(data.platform));
      setVersion(Date.now());
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function copyCaption() {
    void navigator.clipboard.writeText(caption);
  }

  if (!output) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          {loading ? (
            <div className="flex items-center gap-3 text-navy">
              <Spinner className="text-orange h-5 w-5" />
              <div className="flex flex-col">
                <p className="text-sm font-medium">
                  Generating {PLATFORM_LABEL[platform]} caption + 6 slides…
                </p>
                <p className="text-xs text-navy/60">Usually takes 10–25 seconds.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-navy/70">
                No {PLATFORM_LABEL[platform]} content yet. Generate caption + 6 slides with one Claude call.
              </p>
              <Button onClick={regenerate} disabled={loading}>
                Generate {PLATFORM_LABEL[platform]}
              </Button>
            </>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  const isLinkedIn = platform === "linkedin";
  const pdfHref = `/api/pdf?id=${id}&platform=linkedin&v=${version}`;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy">Caption &amp; hashtags</h3>
            <div className="flex items-center gap-2">
              {loading ? <Spinner className="text-orange" /> : null}
              <Button onClick={copyCaption} variant="ghost" size="sm" disabled={loading}>
                Copy
              </Button>
              <Button onClick={regenerate} variant="secondary" size="sm" disabled={loading}>
                {loading ? "Regenerating…" : "Regenerate"}
              </Button>
            </div>
          </div>
          <div className="relative">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[260px]"
              disabled={loading}
            />
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md">
                <div className="flex items-center gap-2 text-navy">
                  <Spinner className="text-orange h-5 w-5" />
                  <span className="text-sm font-medium">Regenerating…</span>
                </div>
              </div>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">Slides</h3>
          {isLinkedIn ? (
            <a
              href={pdfHref}
              download={`brj-${id}-linkedin.pdf`}
              className={
                "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md transition-colors " +
                (loading
                  ? "bg-orange/40 text-white cursor-not-allowed pointer-events-none"
                  : "bg-orange text-white hover:bg-orange/90")
              }
            >
              Download PDF (6 slides)
            </a>
          ) : null}
        </div>
        <SlideGrid id={id} platform={platform} slides={output.slides} cacheBust={version} />
      </div>
    </div>
  );
}
