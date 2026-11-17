import type { CSSProperties } from "react";

// Where each dot lands (px from the middle), its line color and its delay.
const DOTS: [number, number, string, number][] = [
  [-190, -70, "red", 0],
  [-150, 40, "blue", 60],
  [-120, -110, "green", 20],
  [-90, 70, "purple", 90],
  [-60, -130, "orange", 40],
  [-30, 90, "red", 110],
  [10, -140, "blue", 10],
  [40, 80, "green", 70],
  [70, -120, "purple", 30],
  [100, 60, "orange", 100],
  [130, -100, "red", 50],
  [160, 30, "blue", 80],
  [200, -60, "green", 0],
  [-220, -10, "orange", 120],
  [230, 10, "purple", 60],
  [0, 110, "gray", 130],
];

// A handful of route-colored dots thrown from the middle of the nearest
// `relative` box, once.
export function Confetti() {
  return (
    <span className="confetti" aria-hidden>
      {DOTS.map(([x, y, color, delay], index) => (
        <i
          key={index}
          style={
            {
              "--x": `${x}px`,
              "--y": `${y}px`,
              "--c": `var(--${color})`,
              "--d": `${delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
