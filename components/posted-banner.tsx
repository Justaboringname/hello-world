"use client";

import { useEffect } from "react";
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
      className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-950 sm:flex-row sm:items-center sm:justify-between dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
    >
      <div>
        <p className="font-semibold">🎉 {title}</p>
        <p className="mt-0.5 text-sm text-green-800 dark:text-green-300">
          It&apos;s in the feed now. Share the link so friends can vote, and check your
          Profile later to see how it&apos;s doing.
        </p>
      </div>
      <div className="shrink-0">
        <CopyLinkButton path={path} />
      </div>
    </div>
  );
}
