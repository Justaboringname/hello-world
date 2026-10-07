import Link from "next/link";

const links = [
  { href: "/memes", label: "Memes" },
  { href: "/vault", label: "Vault" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-4xl flex-wrap gap-x-5 gap-y-2 px-4 py-6 text-sm text-zinc-500">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
