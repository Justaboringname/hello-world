import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/rate", label: "Rate" },
  { href: "/duel", label: "Beat the bot" },
  { href: "/create", label: "Create" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-rule">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span>
            <span className="font-bold text-ink">Hello World</span> is memes and AI captions from New York.
          </span>
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
