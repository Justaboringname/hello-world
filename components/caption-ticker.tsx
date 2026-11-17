import type { CSSProperties } from "react";

// A yellow service-notice ribbon of winning captions, scrolling by. The track
// holds the list twice, so the loop has no seam. Decorative: every caption in
// it is also on the page or in the feed.
export function CaptionTicker({ lines }: { lines: string[] }) {
  if (lines.length < 3) return null;
  // A steady reading pace, however many captions there are.
  const seconds = Math.max(24, Math.round(lines.join("").length * 0.2));
  const run = lines.map((line, index) => (
    <li key={index} className="flex items-center whitespace-nowrap">
      <span className="joke px-7 text-[1.2rem] sm:text-[1.35rem]">&ldquo;{line}&rdquo;</span>
      <span className="h-2.5 w-2.5 rounded-full bg-black" />
    </li>
  ));

  return (
    <div className="ticker overflow-hidden bg-yellow py-3 text-black" aria-hidden>
      <div className="ticker-track" style={{ "--ticker-duration": `${seconds}s` } as CSSProperties}>
        <ul className="flex shrink-0 items-center">{run}</ul>
        <ul className="flex shrink-0 items-center">{run}</ul>
      </div>
    </div>
  );
}
