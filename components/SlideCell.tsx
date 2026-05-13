"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { SIZE, type Platform, type Slide } from "@/lib/brand";

export function SlideCell({
  id,
  platform,
  slide,
  index,
  cacheBust,
}: {
  id: string;
  platform: Platform;
  slide: Slide;
  index: number;
  cacheBust: number;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const src = `/api/slide?id=${id}&platform=${platform}&index=${index}&v=${cacheBust}&r=${retryToken}`;
  const { width, height } = SIZE[platform];

  async function fetchErrorDetail(): Promise<string> {
    try {
      const res = await fetch(src);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (typeof data?.error === "string") return data.error;
      } catch {
        // not JSON
      }
      if (text) return text.slice(0, 300);
      return `HTTP ${res.status}`;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  async function handleImgError() {
    const detail = await fetchErrorDetail();
    setErrorDetail(detail);
    setStatus("error");
  }

  function retry() {
    setErrorDetail(null);
    setStatus("loading");
    setRetryToken((t) => t + 1);
  }

  return (
    <div className="rounded-md overflow-hidden border border-navy/10 bg-white flex flex-col">
      <div
        className="relative w-full bg-navy/5"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {status !== "error" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${cacheBust}-${retryToken}`}
            src={src}
            alt={`${platform} slide ${index + 1}: ${slide.headline}`}
            onLoad={() => setStatus("ready")}
            onError={() => {
              void handleImgError();
            }}
            className={
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " +
              (status === "ready" ? "opacity-100" : "opacity-0")
            }
          />
        ) : null}

        {status === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Spinner className="h-6 w-6 text-orange" />
            <span className="text-xs text-navy/60 font-medium">Rendering slide…</span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="text-xs text-red-600 font-semibold">Could not render this slide</span>
            {errorDetail ? (
              <span className="text-[11px] text-navy/70 line-clamp-4 leading-snug">
                {errorDetail}
              </span>
            ) : null}
            <button
              type="button"
              onClick={retry}
              className="text-xs underline text-navy/70 hover:text-orange mt-1"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-xs text-navy/60 px-3 py-2 border-t border-navy/10">
        <span>
          Slide {index + 1} · {slide.treatment}
        </span>
        <a
          href={src}
          download={`${platform}-${index + 1}.png`}
          className={
            "underline " +
            (status === "ready" ? "hover:text-orange" : "pointer-events-none opacity-40")
          }
        >
          Download
        </a>
      </div>
    </div>
  );
}
