"use client";

import { useEffect } from "react";
import { Confetti } from "@/components/confetti";
import { CopyLinkButton } from "@/components/copy-link-button";

// Shown once, right after posting (?posted=1), so the poster knows it worked
// and where to find it. Drops ?posted=1 from the address bar, so a reload or a
// copied link doesn't show it again.
export function PostedBanner({ title, path }: { title: string; path: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", path);
  }, [path]);

  return (
    <div
      role="status"
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-accent p-5 text-on-accent sm:flex-row sm:items-center sm:justify-between"
    >
      <Confetti />
      <div className="relative">
        <p className="display text-[2.1rem]">{title}</p>
        <p className="mt-1.5 max-w-md text-sm font-medium">
          It&apos;s in the feed now. Share the link so friends can vote, and check your
          Profile later to see how it&apos;s doing.
        </p>
      </div>
      <div className="relative shrink-0">
        <CopyLinkButton
          path={path}
          className="key inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-on-accent px-5 py-2.5 font-semibold text-accent shadow-[0_3px_0_rgb(0_0_0/0.35)]"
        />
      </div>
    </div>
  );
}
