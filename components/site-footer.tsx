import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/rate", label: "Rate" },
  { href: "/create", label: "Create" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <Logo className="h-5 w-5" />
          <span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Hello World</span>{" "}
            · memes and AI captions from New York
          </span>
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
