import Link from "next/link";
import type { ReactNode } from "react";
import { Bullet } from "@/components/bullet";
import { GenerationCard } from "@/components/generation-card";
import { Check, Lock } from "@/components/icons";
import { LinkPending } from "@/components/link-pending";
import { MemeCard } from "@/components/meme-card";
import { Page, PageHeader } from "@/components/page";
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
import { btnPrimary, btnPrimarySmall, btnSecondary, btnSecondarySmall, textLink } from "@/lib/ui";

export const metadata = { title: "Rate · Hello World" };

function rateHref(tab: RateTab, page = 0, before?: UnratedCursor | null) {
  const params = new URLSearchParams();
  if (tab !== "all") params.set("tab", tab);
  if (page > 0) params.set("page", String(page));
  if (before) params.set("before", encodeCursor(before));
  const query = params.toString();
  return query ? `/rate?${query}` : "/rate";
}

const notice = "rounded-xl border border-rule bg-raised px-4 py-3 text-sm";

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
    <Page width="max-w-6xl">
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,40rem)] lg:justify-center lg:gap-14">
        {/* On wide screens the title, tabs and post buttons stay put while the feed scrolls. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PageHeader glyph="R" color="yellow" title="Rate">
            Vote for the memes and AI captions that actually made you laugh.
          </PageHeader>

          <nav className="mt-6 flex flex-wrap gap-1.5 lg:flex-col lg:gap-1" aria-label="Feed">
            {tabs.map((key) => (
              <Link
                key={key}
                href={rateHref(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-semibold transition-colors ${
                  tab === key ? "bg-ink text-canvas" : "text-muted hover:bg-rule/50 hover:text-ink"
                }`}
              >
                {RATE_TABS[key]}
                {key === "new" && unratedCount ? (
                  <Bullet color="yellow" className="text-[0.8rem]" label={`${unratedCount} new`}>
                    {unratedCount > 99 ? "99+" : unratedCount}
                  </Bullet>
                ) : null}
                <LinkPending />
              </Link>
            ))}
          </nav>

          <div className="mt-5 flex flex-wrap gap-2.5 lg:mt-8 lg:flex-col lg:items-start">
            <Link href="/create?mode=meme" className={btnPrimarySmall}>
              Post a meme
            </Link>
            <Link href="/create" className={btnSecondarySmall}>
              Caption a photo with AI
            </Link>
          </div>
        </aside>

        <div className="mt-7 min-w-0 lg:mt-1">
          <div className="flex flex-col gap-4 empty:hidden">
            {showsMemes &&
              (viewer ? (
                membersOnlyCount > 0 && (
                  <p className={`${notice} flex items-center gap-2.5`}>
                    <Bullet color="blue" className="text-[0.9rem]">
                      <Lock className="h-[0.9em] w-[0.9em]" />
                    </Bullet>
                    <span>
                      You&apos;re signed in, so {membersOnlyCount} members-only{" "}
                      {membersOnlyCount === 1 ? "meme is" : "memes are"} unlocked. Look for
                      the &ldquo;Members only&rdquo; tag.
                    </span>
                  </p>
                )
              ) : (
                <MoreMemesCard loginHref={loginHref} hiddenCount={membersOnlyCount} />
              ))}
            {!viewer && tab === "photos" && (
              <p className={notice}>
                You&apos;re browsing as a guest.{" "}
                <Link href={loginHref} className={textLink}>
                  Sign in with Google
                </Link>{" "}
                to vote.
              </p>
            )}
            {tab === "new" && viewer && items.length > 0 && (
              <p className="text-sm text-muted">
                Posts from other people that you haven&apos;t rated yet, newest first. Once
                you vote on one, it leaves this list.
              </p>
            )}
          </div>

          {!feed ? (
            <EmptyState
              title="Sign in to see what's new for you"
              body="We'll keep track of what you've rated, so you only see posts that are new to you."
            >
              <Link href={loginHref} className={btnPrimary}>
                Sign in with Google
              </Link>
            </EmptyState>
          ) : feed.error ? (
            <p className="mt-8 font-medium text-down">Failed to load the feed: {feed.error.message}</p>
          ) : items.length === 0 ? (
            tab === "new" ? (
              <EmptyState
                mark={
                  <Bullet color="green" className="text-[2rem]">
                    <Check className="h-[0.95em] w-[0.95em]" />
                  </Bullet>
                }
                title={before ? "That's everything" : "You're all caught up"}
                body="You've rated every post that's new to you. Come back later for more, or post something of your own."
              >
                <Link href="/create?mode=meme" className={btnPrimary}>
                  Post a meme
                </Link>
                <Link href="/rate" className={btnSecondary}>
                  Browse everything
                </Link>
              </EmptyState>
            ) : (
              <EmptyState title={page > 0 ? "Nothing older" : "Nothing here yet"}>
                <Link href={tab === "photos" ? "/create" : "/create?mode=meme"} className={btnPrimary}>
                  {tab === "photos" ? "Be the first to caption a photo" : "Be the first to post a meme"}
                </Link>
              </EmptyState>
            )
          ) : (
            <div className="mt-5 flex flex-col gap-7 first:mt-0">
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

          {feed &&
            !feed.error &&
            (tab === "new"
              ? (before || feed.next) && (
                  <nav className="mt-10 flex justify-between gap-3" aria-label="More posts">
                    {before ? (
                      <Link href={rateHref("new")} className={btnSecondary}>
                        Back to newest
                      </Link>
                    ) : (
                      <span />
                    )}
                    {feed.next && (
                      <Link href={rateHref("new", 0, feed.next)} className={btnPrimary}>
                        Next posts
                      </Link>
                    )}
                  </nav>
                )
              : (page > 0 || feed.hasMore) && (
                  <nav className="mt-10 flex justify-between gap-3" aria-label="More posts">
                    {page > 0 ? (
                      <Link href={rateHref(tab, page - 1)} className={btnSecondary}>
                        Newer
                      </Link>
                    ) : (
                      <span />
                    )}
                    {feed.hasMore && (
                      <Link href={rateHref(tab, page + 1)} className={btnSecondary}>
                        Older
                      </Link>
                    )}
                  </nav>
                ))}
        </div>
      </div>
    </Page>
  );
}

function EmptyState({
  mark,
  title,
  body,
  children,
}: {
  mark?: ReactNode;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-rule bg-surface px-6 py-12 text-center first:mt-0">
      {mark}
      <p className="display text-[2.2rem]">{title}</p>
      {body && <p className="max-w-sm text-muted">{body}</p>}
      {children && <div className="mt-3 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

// What the old /vault page became: members-only memes, unlocked by signing in.
function MoreMemesCard({ loginHref, hiddenCount }: { loginHref: string; hiddenCount: number }) {
  return (
    <div className="sign sign-line flex flex-col gap-4 rounded-2xl px-5 pb-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="display flex items-center gap-2.5 text-[1.9rem]">
          <Lock className="h-[0.75em] w-[0.75em]" />
          {hiddenCount > 0
            ? `Sign in to see ${hiddenCount} more ${hiddenCount === 1 ? "meme" : "memes"}`
            : "Sign in to see more memes"}
        </p>
        <p className="mt-1.5 max-w-md text-sm text-sign-muted">
          Members get extra memes you won&apos;t find here, can vote on every meme
          and caption, and can post their own.
        </p>
      </div>
      <Link href={loginHref} className={`${btnPrimary} shrink-0`}>
        Sign in with Google
      </Link>
    </div>
  );
}
