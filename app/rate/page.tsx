import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { MemeCard } from "@/components/meme-card";
import { getViewer } from "@/lib/auth";
import { getMyMemeVotes, getMyVotes, getRateFeed } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Rate · Hello World" };

// Public: anyone can browse photos and public memes. Voting, and the
// members-only memes, need a signed-in user.
export default async function RatePage({ searchParams }: PageProps<"/rate">) {
  const page = Math.max(0, Math.floor(Number(firstParam((await searchParams).page)) || 0));
  const [viewer, feed] = await Promise.all([getViewer(), getRateFeed(page)]);

  const photos = feed.items.flatMap((item) => (item.kind === "photo" ? [item.generation] : []));
  const memes = feed.items.flatMap((item) => (item.kind === "meme" ? [item.meme] : []));
  const [captionVotes, memeVotes] = await Promise.all([
    getMyVotes(
      viewer?.userId,
      photos.flatMap((generation) => generation.captions.map((caption) => caption.id)),
    ),
    getMyMemeVotes(
      viewer?.userId,
      memes.map((meme) => meme.id),
    ),
  ]);

  const currentPath = page > 0 ? `/rate?page=${page}` : "/rate";
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Rate</h1>
          <p className="mt-2 text-zinc-500">
            AI captions on photos from around the city, plus classic memes. Vote
            for the ones that actually made you laugh.
          </p>
        </div>
        <Link
          href="/create"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Caption a photo
        </Link>
      </div>

      {!viewer && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          You&apos;re browsing as a guest.{" "}
          <Link href={loginHref} className="font-medium underline">
            Sign in with Google
          </Link>{" "}
          to vote and see more memes.
        </p>
      )}

      {feed.error ? (
        <p className="mt-8 text-red-600">Failed to load the feed: {feed.error.message}</p>
      ) : feed.items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-lg font-medium">{page > 0 ? "Nothing older." : "Nothing to rate yet."}</p>
          <Link href="/create" className="mt-2 inline-block text-blue-600 hover:underline">
            Be the first to caption a photo &rarr;
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {feed.items.map((item) =>
            item.kind === "photo" ? (
              <GenerationCard
                key={`photo-${item.generation.id}`}
                generation={item.generation}
                votes={captionVotes}
                signedIn={Boolean(viewer)}
                loginHref={loginHref}
              />
            ) : (
              <MemeCard
                key={`meme-${item.meme.id}`}
                meme={item.meme}
                myVote={memeVotes.get(item.meme.id) ?? null}
                signedIn={Boolean(viewer)}
                loginHref={loginHref}
              />
            ),
          )}
        </div>
      )}

      {!viewer && !feed.hasMore && <MoreMemesCard loginHref={loginHref} />}

      {(page > 0 || feed.hasMore) && (
        <nav className="mt-10 flex justify-between text-sm">
          {page > 0 ? (
            <Link
              href={page === 1 ? "/rate" : `/rate?page=${page - 1}`}
              className="text-blue-600 hover:underline"
            >
              &larr; Newer
            </Link>
          ) : (
            <span />
          )}
          {feed.hasMore && (
            <Link href={`/rate?page=${page + 1}`} className="text-blue-600 hover:underline">
              Older &rarr;
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

// What the old /vault page became: members-only memes, unlocked by signing in.
function MoreMemesCard({ loginHref }: { loginHref: string }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-3xl" aria-hidden>
        🔒
      </p>
      <p className="text-lg font-semibold">Sign in to see more memes</p>
      <p className="max-w-sm text-sm text-zinc-500">
        Members get extra memes you won&apos;t find here, plus a vote on every
        caption and meme.
      </p>
      <Link
        href={loginHref}
        className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Sign in with Google
      </Link>
    </div>
  );
}
