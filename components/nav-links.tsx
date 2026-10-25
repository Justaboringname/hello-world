"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkPending } from "@/components/link-pending";

// shortLabel is shown on phones, where the full one would wrap the header.
const links: { href: string; label: string; shortLabel?: string }[] = [
  { href: "/rate", label: "Rate" },
  { href: "/duel", label: "Beat the bot", shortLabel: "🤖" },
  { href: "/create", label: "Create" },
];

// The header's main links, with the current section highlighted.
export function NavLinks() {
  const pathname = usePathname();
  // A photo page (/p/...) or meme page (/m/...) belongs to Rate.
  const section = /^\/(p|m)\//.test(pathname) ? "/rate" : pathname;

  return (
    <>
      {links.map((link) => {
        const active = section === link.href || section.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            aria-label={link.shortLabel ? link.label : undefined}
            className={`whitespace-nowrap rounded-full px-2 py-1.5 font-medium transition sm:px-3 ${
              active
                ? "bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/10 dark:text-white"
                : "text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            {link.shortLabel ? (
              <>
                <span className="sm:hidden">{link.shortLabel}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </>
            ) : (
              link.label
            )}
            <LinkPending />
          </Link>
        );
      })}
    </>
  );
}
