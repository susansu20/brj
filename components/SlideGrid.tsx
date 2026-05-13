import type { Platform, Slide } from "@/lib/brand";

export function SlideGrid({
  id,
  platform,
  slides,
  cacheBust,
}: {
  id: string;
  platform: Platform;
  slides: Slide[];
  cacheBust: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {slides.map((slide, i) => {
        const src = `/api/slide?id=${id}&platform=${platform}&index=${i}&v=${cacheBust}`;
        return (
          <div
            key={i}
            className="rounded-md overflow-hidden border border-navy/10 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${platform} slide ${i + 1}`}
              className="w-full h-auto block"
              loading="lazy"
            />
            <div className="flex items-center justify-between text-xs text-navy/60 px-3 py-2 border-t border-navy/10">
              <span>
                Slide {i + 1} · {slide.treatment}
              </span>
              <a
                href={src}
                download={`${platform}-${i + 1}.png`}
                className="underline hover:text-orange"
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
