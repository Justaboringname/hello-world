import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
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
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3 text-sm sm:gap-5">
        <Link href="/" className="whitespace-nowrap font-semibold">
          Hello World
        </Link>
        <Link href="/rate" className="text-zinc-600 hover:underline dark:text-zinc-400">
          Rate
        </Link>
        <Link href="/rate?tab=memes" className="text-zinc-600 hover:underline dark:text-zinc-400">
          Memes
        </Link>
        <Link href="/create" className="text-zinc-600 hover:underline dark:text-zinc-400">
          Create
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {viewer ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 hover:underline">
                <Avatar src={viewer.profile?.avatar_url} name={name} />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <form action={signOut}>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="whitespace-nowrap border border-zinc-300 px-2 py-1.5 hover:bg-zinc-100 sm:px-3 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            // Where "Vault 🔒" used to be: members get extra memes.
            <Link
              href="/login?next=%2Frate%3Ftab%3Dmemes"
              className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
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
