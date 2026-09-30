import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { getViewer } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";

export default async function Home() {
  const viewer = await getViewer();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 font-sans dark:bg-black">
      <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Hello World
      </h1>

      {viewer ? (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <Avatar
            src={viewer.profile?.avatar_url}
            name={viewer.profile?.first_name ?? viewer.email ?? ""}
            size="lg"
          />
          {isProfileComplete(viewer.profile) ? (
            <p className="text-lg">
              Welcome back, <strong>{viewer.profile!.first_name}</strong>!
            </p>
          ) : (
            <p className="text-lg">
              Almost there —{" "}
              <Link href="/onboarding" className="text-blue-600 hover:underline">
                add your name
              </Link>{" "}
              to finish setting up.
            </p>
          )}
          <div className="flex gap-4">
            <Link href="/vault" className="text-blue-600 hover:underline">
              Open the vault &rarr;
            </Link>
            <Link href="/profile" className="text-blue-600 hover:underline">
              Edit profile &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Sign in with Google to unlock the members-only meme vault.
          </p>
          <Link
            href="/login?next=/vault"
            className="rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Sign in with Google
          </Link>
        </div>
      )}

      <Link href="/memes" className="text-lg text-blue-600 hover:underline">
        View memes &rarr;
      </Link>
    </main>
  );
}
