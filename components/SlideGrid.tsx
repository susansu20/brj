import type { Platform, Slide } from "@/lib/brand";
import { SlideCell } from "@/components/SlideCell";

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
      {slides.map((slide, i) => (
        <SlideCell
          key={`${i}-${cacheBust}`}
          id={id}
          platform={platform}
          slide={slide}
          index={i}
          cacheBust={cacheBust}
        />
      ))}
    </div>
  );
}
