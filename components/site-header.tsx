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
      <nav className="mx-auto flex w-full max-w-4xl items-center gap-5 px-4 py-3 text-sm">
        <Link href="/" className="font-semibold">
          Hello World
        </Link>
        <Link href="/rate" className="text-zinc-600 hover:underline dark:text-zinc-400">
          Rate
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
                  className="border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
