"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bullet } from "@/components/bullet";
import { LinkPending } from "@/components/link-pending";
import type { LineColor } from "@/lib/lines";

// Each section rides its own line. The B really is orange and the C blue; the
// R takes green, the color of an upvote. On phones the bullet alone is the link.
const links: { href: string; label: string; glyph: string; color: LineColor }[] = [
  { href: "/rate", label: "Rate", glyph: "R", color: "green" },
  { href: "/duel", label: "Beat the bot", glyph: "B", color: "orange" },
  { href: "/create", label: "Create", glyph: "C", color: "blue" },
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
            aria-label={link.label}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full p-1 font-semibold transition-colors sm:pr-3.5 ${
              active ? "bg-white/15 text-white" : "text-sign-muted hover:text-white"
            }`}
          >
            <Bullet color={link.color} className="text-[1.15rem]">
              {link.glyph}
            </Bullet>
            <span className="hidden sm:inline">{link.label}</span>
            <LinkPending />
          </Link>
        );
      })}
    </>
  );
}
