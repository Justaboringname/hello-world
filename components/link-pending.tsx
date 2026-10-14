"use client";

import { useLinkStatus } from "next/link";

// A small spinner inside a <Link> while the page it points to is loading, so
// a click always gets a response even when the server is slow.
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent align-[-1px]"
    />
  );
}
