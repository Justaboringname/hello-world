import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { MemeCard } from "@/components/meme-card";
import { getViewer } from "@/lib/auth";
import { RATE_TABS, isRateTab, type RateTab } from "@/lib/captions";
import { getMembersOnlyMemeCount, getMyMemeVotes, getMyVotes, getRateFeed } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Rate · Hello World" };

function rateHref(tab: RateTab, page = 0) {
  const params = new URLSearchParams();
  if (tab !== "all") params.set("tab", tab);
  if (page > 0) params.set("page", String(page));
  const query = params.toString();
  return query ? `/rate?${query}` : "/rate";
}

// Public: anyone can browse photos and public memes. Voting, and the
// members-only memes (what used to be /vault), need a signed-in user.
export default async function RatePage({ searchParams }: PageProps<"/rate">) {
  const params = await searchParams;
  const tabParam = firstParam(params.tab);
  const tab: RateTab = isRateTab(tabParam) ? tabParam : "all";
  const page = Math.max(0, Math.floor(Number(firstParam(params.page)) || 0));

  const [viewer, feed, membersOnlyCount] = await Promise.all([
    getViewer(),
    getRateFeed(page, tab),
    getMembersOnlyMemeCount(),
  ]);

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

  const loginHref = `/login?next=${encodeURIComponent(rateHref(tab, page))}`;
  const showsMemes = tab !== "photos";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">Rate</h1>
      <p className="mt-2 text-zinc-500">
        Memes and AI captions on photos from around the city. Vote for the ones
        that actually made you laugh, or post your own.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/create?mode=meme"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Make a meme
        </Link>
        <Link
          href="/create"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          + Caption a photo with AI
        </Link>
      </div>

      <nav className="mt-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800" aria-label="Feed">
        {(Object.keys(RATE_TABS) as RateTab[]).map((key) => (
          <Link
            key={key}
            href={rateHref(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {RATE_TABS[key]}
          </Link>
        ))}
      </nav>

      {showsMemes &&
        (viewer ? (
          membersOnlyCount > 0 && (
            <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              🔓 You&apos;re signed in, so {membersOnlyCount} members-only{" "}
              {membersOnlyCount === 1 ? "meme is" : "memes are"} unlocked. Look
              for the &ldquo;Members only&rdquo; tag.
            </p>
          )
        ) : (
          <MoreMemesCard loginHref={loginHref} hiddenCount={membersOnlyCount} />
        ))}
      {!viewer && !showsMemes && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          You&apos;re browsing as a guest.{" "}
          <Link href={loginHref} className="font-medium underline">
            Sign in with Google
          </Link>{" "}
          to vote.
        </p>
      )}

      {feed.error ? (
        <p className="mt-8 text-red-600">Failed to load the feed: {feed.error.message}</p>
      ) : feed.items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-lg font-medium">{page > 0 ? "Nothing older." : "Nothing here yet."}</p>
          <Link
            href={tab === "photos" ? "/create" : "/create?mode=meme"}
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            {tab === "photos" ? "Be the first to caption a photo" : "Be the first to post a meme"} &rarr;
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

      {(page > 0 || feed.hasMore) && (
        <nav className="mt-10 flex justify-between text-sm">
          {page > 0 ? (
            <Link href={rateHref(tab, page - 1)} className="text-blue-600 hover:underline">
              &larr; Newer
            </Link>
          ) : (
            <span />
          )}
          {feed.hasMore && (
            <Link href={rateHref(tab, page + 1)} className="text-blue-600 hover:underline">
              Older &rarr;
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

// What the old /vault page became: members-only memes, unlocked by signing in.
function MoreMemesCard({ loginHref, hiddenCount }: { loginHref: string; hiddenCount: number }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6 text-center dark:border-blue-900 dark:bg-blue-950/30">
      <p className="text-3xl" aria-hidden>
        🔒
      </p>
      <p className="text-lg font-semibold">
        {hiddenCount > 0
          ? `Sign in to see ${hiddenCount} more ${hiddenCount === 1 ? "meme" : "memes"}`
          : "Sign in to see more memes"}
      </p>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Members get extra memes you won&apos;t find here, can vote on every meme
        and caption, and can post their own.
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
