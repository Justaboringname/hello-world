"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThumbUp } from "@/components/icons";
import { VibeBadge } from "@/components/vibe-badge";

export type ReelSlide = {
  id: number;
  src: string;
  vibe: string;
  location: string | null;
  captions: { id: number; text: string; score: number }[];
};

// Where the reel is: rows before `row` are written out, row `row` has `chars`
// characters so far, and the rest are still blank.
type Frame = { slide: number; row: number; chars: number };

// The product in miniature, on the home page: a real photo from the feed, its
// three AI captions being typed out one after another, and the votes each one
// got. Then the next photo. Hovering pauses it; reduced motion shows the first
// photo with its captions already written.
export function HeroReel({ slides }: { slides: ReelSlide[] }) {
  // Starts with the first photo fully written, so the server-rendered page is
  // complete before any script runs.
  const [frame, setFrame] = useState<Frame>({
    slide: 0,
    row: slides[0]?.captions.length ?? 0,
    chars: 0,
  });
  const [paused, setPaused] = useState(false);

  const current = slides[frame.slide];

  useEffect(() => {
    if (!current || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const typing = current.captions[frame.row];
    let delay: number;
    let next: Frame;
    if (!typing) {
      // Everything is written: hold, then move to the next photo.
      delay = 3400;
      next = { slide: (frame.slide + 1) % slides.length, row: 0, chars: 0 };
    } else if (frame.chars < typing.text.length) {
      // A beat after punctuation, like someone thinking of the next bit.
      delay = /[,.:;!?]/.test(typing.text[frame.chars - 1] ?? "") ? 170 : 24;
      next = { ...frame, chars: frame.chars + 1 };
    } else {
      delay = 620;
      next = { ...frame, row: frame.row + 1, chars: 0 };
    }
    const timer = setTimeout(() => setFrame(next), delay);
    return () => clearTimeout(timer);
  }, [frame, paused, current, slides.length]);

  if (!current) return null;

  return (
    <Link
      href={`/p/${current.id}`}
      aria-label="Open this photo and vote on its captions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group block lg:rotate-[1.2deg]"
    >
      <article className="overflow-hidden rounded-2xl border-[1.5px] border-ink bg-surface shadow-[0.55rem_0.55rem_0_var(--yellow)] transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] bg-black">
          {slides.map((slide, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slide.id}
              src={slide.src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                index === frame.slide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <span className="absolute left-3 top-3 rounded-full bg-black/80 py-1 pl-1 pr-3 text-sm text-white backdrop-blur-sm">
            <VibeBadge vibe={current.vibe} className="!text-white" />
          </span>
        </div>

        <ul className="px-4 pb-2 pt-1 sm:px-5" aria-hidden>
          {current.captions.map((caption, index) => {
            const done = index < frame.row;
            const typing = index === frame.row;
            return (
              <li
                key={caption.id}
                className="flex min-h-[4.4rem] items-center gap-3 border-b border-rule py-2 last:border-0"
              >
                <p className={`joke flex-1 text-[1.02rem] sm:text-[1.1rem] ${typing ? "caret" : ""}`}>
                  {done ? `“${caption.text}”` : typing ? `“${caption.text.slice(0, frame.chars)}` : ""}
                </p>
                {done && (
                  <span
                    className={`pop flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${
                      caption.score > 0 ? "text-up" : "text-muted"
                    }`}
                  >
                    <ThumbUp />
                    {caption.score > 0 ? `+${caption.score}` : caption.score}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </article>
    </Link>
  );
}
