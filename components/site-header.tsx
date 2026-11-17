import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import { Lock } from "@/components/icons";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { SubmitButton } from "@/components/submit-button";
import { getViewer } from "@/lib/auth";
import { btnPrimarySmall } from "@/lib/ui";

// The header is a subway sign: a black band with a white line near its top
// edge, and one route bullet per section.
export async function SiteHeader() {
  const viewer = await getViewer();
  const name =
    [viewer?.profile?.first_name, viewer?.profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    viewer?.email ||
    "";

  return (
    <header className="sign sign-line sticky top-0 z-30" style={{ viewTransitionName: "site-header" }}>
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 pb-2.5 pt-4 text-[0.95rem] sm:gap-1.5">
        <Link href="/" className="mr-1 flex items-center gap-2.5 whitespace-nowrap rounded-full sm:mr-4">
          <Logo />
          <span className="hidden text-[1.05rem] font-bold tracking-tight min-[480px]:inline">Hello World</span>
        </Link>
        <NavLinks />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {viewer ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full p-1 font-semibold text-sign-muted transition-colors hover:text-white sm:pr-3"
              >
                <Avatar src={viewer.profile?.avatar_url} name={name} className="ring-2 ring-white/25" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <form action={signOut}>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="whitespace-nowrap rounded-full px-2.5 py-1.5 font-semibold text-sign-muted transition-colors hover:text-white"
                >
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            // Where "Vault" used to be: members get extra memes.
            <Link href="/login?next=%2Frate%3Ftab%3Dmemes" className={btnPrimarySmall}>
              <Lock />
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">Sign in to see more memes</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
