"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkPending } from "@/components/link-pending";

const links = [
  { href: "/rate", label: "Rate" },
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
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              active
                ? "bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/10 dark:text-white"
                : "text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            {link.label}
            <LinkPending />
          </Link>
        );
      })}
    </>
  );
}
