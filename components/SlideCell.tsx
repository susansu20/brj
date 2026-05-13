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
  const src = `/api/slide?id=${id}&platform=${platform}&index=${index}&v=${cacheBust}`;
  const { width, height } = SIZE[platform];

  function retry() {
    setStatus("loading");
    // Force the browser to re-fetch by changing the URL.
    // The new <img> mount will trigger onLoad/onError again.
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
            // Re-mount on cacheBust so onLoad fires for new renders.
            key={cacheBust}
            src={src}
            alt={`${platform} slide ${index + 1}: ${slide.headline}`}
            loading="lazy"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
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
            <span className="text-xs text-red-600 font-medium">Could not render this slide.</span>
            <button
              type="button"
              onClick={retry}
              className="text-xs underline text-navy/70 hover:text-orange"
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
