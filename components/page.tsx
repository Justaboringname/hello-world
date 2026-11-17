import { ViewTransition, type ReactNode } from "react";
import { Bullet } from "@/components/bullet";
import type { LineColor } from "@/lib/lines";

// Every page's <main>. Moving between pages fades the old one out and lifts
// the new one in; photos with a shared name morph on their own (globals.css).
export function Page({
  children,
  width = "max-w-2xl",
  className = "",
}: {
  children: ReactNode;
  width?: string;
  className?: string;
}) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main className={`mx-auto w-full ${width} flex-1 px-4 py-8 sm:py-12 ${className}`}>
        {children}
      </main>
    </ViewTransition>
  );
}

// A page's title, led by the route bullet its section has in the header.
export function PageHeader({
  glyph,
  color,
  title,
  children,
}: {
  glyph?: string;
  color?: LineColor;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header>
      <h1 className="display flex items-center gap-3 text-[3.25rem] sm:gap-4 sm:text-[4.25rem]">
        {glyph && color && (
          <Bullet color={color} className="text-[0.62em]">
            {glyph}
          </Bullet>
        )}
        <span>{title}</span>
      </h1>
      {children && <p className="mt-3 max-w-xl text-[1.05rem] text-muted">{children}</p>}
    </header>
  );
}
