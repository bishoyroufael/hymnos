import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlay } from "react-icons/fi";
import type { components } from "@/db/models";
import PreviewSlide from "./PreviewSlide";

type SlideView = components["schemas"]["SlideView"];

interface SlideCarouselProps {
  slides: SlideView[];
  onPresent: () => void;
}

export default function SlideCarousel({ slides, onPresent }: SlideCarouselProps) {
  const [rawCurrent, setCurrent] = useState(0);
  const total = slides.length;
  // Clamp so a stale index can't point past the end after slides shrink.
  const current = Math.min(rawCurrent, total - 1);

  const goPrev = () => setCurrent((i) => Math.max(0, i - 1));
  const goNext = () => setCurrent((i) => Math.min(total - 1, i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrent((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setCurrent((i) => Math.min(total - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const showDots = total <= 14;

  return (
    <div className="flex flex-col gap-3">
      {/* Slide canvas */}
      <div className="relative w-full aspect-video bg-neutral text-neutral-content rounded-xl overflow-hidden shadow-xl">
        <PreviewSlide slide={slides[current]} />

        {/* Hover-reveal prev overlay */}
        {current > 0 && (
          <button
            type="button"
            aria-label="السابق"
            className="absolute inset-y-0 left-0 w-16 flex items-center justify-start pl-3
                       opacity-0 hover:opacity-100 transition-opacity
                       bg-linear-to-r from-black/30 to-transparent"
            onClick={goPrev}
          >
            <FiChevronLeft className="w-8 h-8 text-white/80 drop-shadow" />
          </button>
        )}

        {/* Hover-reveal next overlay */}
        {current < total - 1 && (
          <button
            type="button"
            aria-label="التالي"
            className="absolute inset-y-0 right-0 w-16 flex items-center justify-end pr-3
                       opacity-0 hover:opacity-100 transition-opacity
                       bg-linear-to-l from-black/30 to-transparent"
            onClick={goNext}
          >
            <FiChevronRight className="w-8 h-8 text-white/80 drop-shadow" />
          </button>
        )}

        {/* Slide number badge */}
        <div className="absolute bottom-2 right-4 text-xs text-base-content/50 font-mono select-none" dir="ltr">
          {current + 1} / {total}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2" dir="ltr">
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={goPrev} disabled={current === 0} aria-label="السابق">
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {showDots ? (
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`الشريحة ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-base-content/25 hover:bg-base-content/50"
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-sm text-base-content/60 tabular-nums">
            {current + 1} / {total}
          </span>
        )}

        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={goNext} disabled={current === total - 1} aria-label="التالي">
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Present button */}
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={onPresent}>
          <FiPlay className="w-4 h-4" />
          عرض
        </button>
      </div>
    </div>
  );
}
