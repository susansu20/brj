"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState(output ? composeCaption(output) : "");
  const [version, setVersion] = useState(() => Date.now());

  async function regenerate() {
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setCaption(composeCaption(data.platform as PlatformOutput));
      setVersion(Date.now());
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function copyCaption() {
    void navigator.clipboard.writeText(caption);
  }

  if (!output) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-navy/70">
            No {PLATFORM_LABEL[platform]} content yet. Generate caption + 6 slides with one Claude call.
          </p>
          <Button onClick={regenerate} disabled={pending}>
            {pending ? "Generating…" : `Generate ${PLATFORM_LABEL[platform]}`}
          </Button>
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
              <Button onClick={copyCaption} variant="ghost" size="sm">
                Copy
              </Button>
              <Button onClick={regenerate} variant="secondary" size="sm" disabled={pending}>
                {pending ? "Regenerating…" : "Regenerate"}
              </Button>
            </div>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[260px]"
          />
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
              className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md bg-orange text-white hover:bg-orange/90 transition-colors"
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
