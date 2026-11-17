import { Bullet } from "@/components/bullet";
import { VIBES, isVibe } from "@/lib/captions";

// The voice a photo's captions were written in, marked with its route bullet.
export function VibeBadge({ vibe, className = "" }: { vibe: string; className?: string }) {
  if (!isVibe(vibe)) return <span className={className}>{vibe}</span>;
  const { bullet, label } = VIBES[vibe];
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-ink ${className}`}>
      <Bullet color={bullet.color}>{bullet.glyph}</Bullet>
      {label}
    </span>
  );
}
