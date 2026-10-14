import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { LinkPending } from "@/components/link-pending";
import { MemeCard } from "@/components/meme-card";
import { getViewer } from "@/lib/auth";
import { RATE_TABS, isRateTab, type RateTab } from "@/lib/captions";
import {
  encodeCursor,
  getMembersOnlyMemeCount,
  getMyMemeVotes,
  getMyVotes,
  getRateFeed,
  getUnratedCount,
  getUnratedFeed,
  parseCursor,
  type FeedItem,
  type UnratedCursor,
} from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Rate · Hello World" };

function rateHref(tab: RateTab, page = 0, before?: UnratedCursor | null) {
  const params = new URLSearchParams();
  if (tab !== "all") params.set("tab", tab);
  if (page > 0) params.set("page", String(page));
  if (before) params.set("before", encodeCursor(before));
  const query = params.toString();
  return query ? `/rate?${query}` : "/rate";
}

const primaryButton =
  "rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700";
const secondaryButton =
  "rounded-full border border-zinc-300 bg-surface px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

// Public: anyone can browse photos and public memes. Voting, the
// members-only memes (what used to be /vault) and New for you need a
// signed-in user.
export default async function RatePage({ searchParams }: PageProps<"/rate">) {
  const params = await searchParams;
  const tabParam = firstParam(params.tab);
  const tab: RateTab = isRateTab(tabParam) ? tabParam : "all";
  const page = Math.max(0, Math.floor(Number(firstParam(params.page)) || 0));
  const before = tab === "new" ? parseCursor(firstParam(params.before)) : null;

  const viewer = await getViewer();
  const [feed, membersOnlyCount, unratedCount] = await Promise.all([
    tab === "new"
      ? viewer
        ? getUnratedFeed(before).then((result) => ({ ...result, hasMore: Boolean(result.next) }))
        : null
      : getRateFeed(page, tab).then((result) => ({ ...result, next: null })),
    getMembersOnlyMemeCount(),
    getUnratedCount(viewer?.userId),
  ]);

  const items: FeedItem[] = feed?.items ?? [];
  const photos = items.flatMap((item) => (item.kind === "photo" ? [item.generation] : []));
  const memes = items.flatMap((item) => (item.kind === "meme" ? [item.meme] : []));
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

  const loginHref = `/login?next=${encodeURIComponent(rateHref(tab, page, before))}`;
  const showsMemes = tab === "all" || tab === "memes";
  // New for you is personal, so signed-out visitors don't get the tab.
  const tabs = (Object.keys(RATE_TABS) as RateTab[]).filter((key) => key !== "new" || viewer);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 font-sans sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Rate</h1>
          <p className="mt-1 text-zinc-500">
            Vote for the memes and AI captions that actually made you laugh.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/create?mode=meme" className={primaryButton}>
            + Meme
          </Link>
          <Link href="/create" className={secondaryButton}>
            + AI captions
          </Link>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Feed">
        {tabs.map((key) => (
          <Link
            key={key}
            href={rateHref(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                : "border border-zinc-200 bg-surface text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {RATE_TABS[key]}
            {key === "new" && unratedCount ? (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  tab === key ? "bg-white/20" : "bg-blue-600 text-white"
                }`}
              >
                {unratedCount > 99 ? "99+" : unratedCount}
              </span>
            ) : null}
            <LinkPending />
          </Link>
        ))}
      </nav>

      {showsMemes &&
        (viewer ? (
          membersOnlyCount > 0 && (
            <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              🔓 You&apos;re signed in, so {membersOnlyCount} members-only{" "}
              {membersOnlyCount === 1 ? "meme is" : "memes are"} unlocked. Look
              for the &ldquo;Members only&rdquo; tag.
            </p>
          )
        ) : (
          <MoreMemesCard loginHref={loginHref} hiddenCount={membersOnlyCount} />
        ))}
      {!viewer && tab === "photos" && (
        <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          You&apos;re browsing as a guest.{" "}
          <Link href={loginHref} className="font-medium underline">
            Sign in with Google
          </Link>{" "}
          to vote.
        </p>
      )}
      {tab === "new" && viewer && items.length > 0 && (
        <p className="mt-5 text-sm text-zinc-500">
          Posts from other people that you haven&apos;t rated yet, newest first. Once
          you vote on one, it leaves this list.
        </p>
      )}

      {!feed ? (
        <EmptyState
          emoji="✨"
          title="Sign in to see what's new for you"
          body="We'll keep track of what you've rated, so you only see posts that are new to you."
        >
          <Link href={loginHref} className={primaryButton}>
            Sign in with Google
          </Link>
        </EmptyState>
      ) : feed.error ? (
        <p className="mt-8 text-red-600">Failed to load the feed: {feed.error.message}</p>
      ) : items.length === 0 ? (
        tab === "new" ? (
          <EmptyState
            emoji="🎉"
            title={before ? "That's everything." : "You're all caught up!"}
            body="You've rated every post that's new to you. Come back later for more, or post something of your own."
          >
            <Link href="/create?mode=meme" className={primaryButton}>
              Make a meme
            </Link>
            <Link href="/rate" className={secondaryButton}>
              Browse everything
            </Link>
          </EmptyState>
        ) : (
          <EmptyState emoji="🫥" title={page > 0 ? "Nothing older." : "Nothing here yet."}>
            <Link href={tab === "photos" ? "/create" : "/create?mode=meme"} className={primaryButton}>
              {tab === "photos" ? "Be the first to caption a photo" : "Be the first to post a meme"}
            </Link>
          </EmptyState>
        )
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {items.map((item) =>
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

      {feed && !feed.error && (tab === "new" ? (
        (before || feed.next) && (
          <nav className="mt-10 flex justify-between gap-3">
            {before ? (
              <Link href={rateHref("new")} className={secondaryButton}>
                &uarr; Back to newest
              </Link>
            ) : (
              <span />
            )}
            {feed.next && (
              <Link href={rateHref("new", 0, feed.next)} className={primaryButton}>
                Next posts &rarr;
              </Link>
            )}
          </nav>
        )
      ) : (
        (page > 0 || feed.hasMore) && (
          <nav className="mt-10 flex justify-between gap-3">
            {page > 0 ? (
              <Link href={rateHref(tab, page - 1)} className={secondaryButton}>
                &larr; Newer
              </Link>
            ) : (
              <span />
            )}
            {feed.hasMore && (
              <Link href={rateHref(tab, page + 1)} className={secondaryButton}>
                Older &rarr;
              </Link>
            )}
          </nav>
        )
      ))}
    </main>
  );
}

function EmptyState({
  emoji,
  title,
  body,
  children,
}: {
  emoji: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-surface p-10 text-center dark:border-zinc-700">
      <p className="text-4xl" aria-hidden>
        {emoji}
      </p>
      <p className="text-lg font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-zinc-500">{body}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

// What the old /vault page became: members-only memes, unlocked by signing in.
function MoreMemesCard({ loginHref, hiddenCount }: { loginHref: string; hiddenCount: number }) {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6 text-center dark:border-blue-900 dark:bg-blue-950/30">
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
      <Link href={loginHref} className={primaryButton}>
        Sign in with Google
      </Link>
    </div>
  );
}
