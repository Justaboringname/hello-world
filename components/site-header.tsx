import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { SubmitButton } from "@/components/submit-button";
import { getViewer } from "@/lib/auth";

export async function SiteHeader() {
  const viewer = await getViewer();
  const name =
    [viewer?.profile?.first_name, viewer?.profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    viewer?.email ||
    "";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <nav className="mx-auto flex w-full max-w-4xl items-center gap-0.5 px-4 py-2.5 text-sm sm:gap-2">
        <Link href="/" className="mr-1 flex items-center gap-2 whitespace-nowrap font-semibold sm:mr-3">
          <Logo />
          <span className="hidden min-[440px]:inline">Hello World</span>
        </Link>
        <NavLinks />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {viewer ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-zinc-900/[0.04] sm:pr-3 dark:hover:bg-white/5"
              >
                <Avatar src={viewer.profile?.avatar_url} name={name} />
                <span className="hidden font-medium sm:inline">Profile</span>
              </Link>
              <form action={signOut}>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="whitespace-nowrap px-3 py-1.5 text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            // Where "Vault 🔒" used to be: members get extra memes.
            <Link
              href="/login?next=%2Frate%3Ftab%3Dmemes"
              className="whitespace-nowrap rounded-full bg-blue-600 px-3.5 py-1.5 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">🔒 Sign in to see more memes</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
