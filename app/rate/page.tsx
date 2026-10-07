import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { getViewer } from "@/lib/auth";
import { getFeed, getMyVotes } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Rate captions · Hello World" };

// Public: anyone can browse, and the vote buttons send signed-out visitors to
// sign in first.
export default async function RatePage({ searchParams }: PageProps<"/rate">) {
  const page = Math.max(0, Math.floor(Number(firstParam((await searchParams).page)) || 0));
  const [viewer, feed] = await Promise.all([getViewer(), getFeed(page)]);
  const votes = await getMyVotes(
    viewer?.userId,
    feed.generations.flatMap((generation) => generation.captions.map((caption) => caption.id)),
  );
  const currentPath = page > 0 ? `/rate?page=${page}` : "/rate";
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Rate captions</h1>
          <p className="mt-2 text-zinc-500">
            Gemini wrote three captions for every photo. Vote for the ones that
            actually made you laugh.
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
          to vote.
        </p>
      )}

      {feed.error ? (
        <p className="mt-8 text-red-600">Failed to load photos: {feed.error.message}</p>
      ) : feed.generations.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-lg font-medium">
            {page > 0 ? "No more photos." : "No photos yet."}
          </p>
          <Link href="/create" className="mt-2 inline-block text-blue-600 hover:underline">
            Be the first to caption one &rarr;
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {feed.generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              votes={votes}
              signedIn={Boolean(viewer)}
              loginHref={loginHref}
            />
          ))}
        </div>
      )}

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
