import type { CSSProperties, ReactNode } from "react";
import { LINES, type LineColor } from "@/lib/lines";

// A subway route bullet: a disc in a line's color with one glyph on it. Its
// size follows the text size around it.
export function Bullet({
  color,
  children,
  className = "",
  label,
}: {
  color: LineColor;
  children: ReactNode;
  className?: string;
  // What it stands for, when the glyph alone doesn't say (read aloud).
  label?: string;
}) {
  const line = LINES[color];
  return (
    <span
      className={`bullet ${className}`}
      style={{ "--b": line.fill, "--bt": line.glyph } as CSSProperties}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {children}
    </span>
  );
}
