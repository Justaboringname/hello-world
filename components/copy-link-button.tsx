"use client";

import { useState } from "react";
import { Check, LinkIcon } from "@/components/icons";
import { btnSecondary } from "@/lib/ui";

// Shares a page's clean URL (path, without ?posted=1 and the like). Phones
// get the native share sheet; everyone else gets the link copied.
export function CopyLinkButton({
  path,
  title,
  className = btnSecondary,
}: {
  path: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ url, title });
        return;
      } catch (error) {
        // Closing the share sheet is not an error worth falling back from.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the URL bar still works.
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? <Check /> : <LinkIcon />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
