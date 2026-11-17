import Link from "next/link";
import { ViewTransition, type CSSProperties, type ReactNode } from "react";
import { Bullet } from "@/components/bullet";
import { CaptionTicker } from "@/components/caption-ticker";
import { HeroReel, type ReelSlide } from "@/components/hero-reel";
import { Crown, Pin } from "@/components/icons";
import { MemeImage } from "@/components/meme-image";
import { getViewer } from "@/lib/auth";
import {
  getRateFeed,
  getTopCaptions,
  getTopMemes,
  getUnratedCount,
  memeImageUrl,
  photoUrl,
  type RankedCaption,
} from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";
import { daysAgo, startOfTodayInNewYork } from "@/lib/time";
import { btnPrimary, btnSecondary, textLink } from "@/lib/ui";

const STEPS = [
  ["Snap the city", "Post a photo from your week, or a meme you made."],
  ["AI captions it", "Pick a vibe and get three AI captions in seconds."],
  ["Everyone votes", "The funniest caption each day is Caption of the Day."],
];

// Ranks ride the lines that carry their number: the 1, 2 and 3 are red, the
// 4 and 5 green.
const RANK_COLORS = ["red", "red", "red", "green", "green"] as const;

export default async function Home() {
  const viewer = await getViewer();
  const [today, week, allTime, topMemes, unrated, photoFeed] = await Promise.all([
    getTopCaptions(startOfTodayInNewYork(), 1),
    getTopCaptions(daysAgo(7), 5),
    getTopCaptions(new Date(0), 12),
    getTopMemes(4),
    getUnratedCount(viewer?.userId),
    getRateFeed(0, "photos"),
  ]);
  const captionOfTheDay = today[0];
  // A quiet week still gets a board: the best captions so far.
  const board = week.length > 0 ? week : allTime.slice(0, 5);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // The hero plays the photos whose captions did best.
  const reel: ReelSlide[] = photoFeed.items
    .flatMap((item) => (item.kind === "photo" ? [item.generation] : []))
    .map((generation) => ({
      id: generation.id,
      src: photoUrl(generation.image_path),
      vibe: generation.vibe,
      location: generation.location,
      captions: generation.captions.map(({ id, text, score }) => ({ id, text, score })),
      best: Math.max(...generation.captions.map((caption) => caption.score)),
    }))
    .filter((slide) => slide.captions.length > 0)
    .sort((a, b) => b.best - a.best)
    .slice(0, 5)
    .map(({ id, src, vibe, location, captions }) => ({ id, src, vibe, location, captions }));

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main className="flex-1">
        <section className="relative">
          <div aria-hidden className="tile pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid w-full max-w-6xl items-start gap-x-14 gap-y-10 px-4 pb-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:pb-16">
            <div>
              <h1 className="display text-[clamp(3.1rem,13vw,6.1rem)]">
                <span className="rise">
                  <span>Snap the city.</span>
                </span>
                <span className="rise">
                  <span style={{ "--d": "110ms" } as CSSProperties}>Vote on</span>
                </span>
                <span className="rise">
                  <span style={{ "--d": "220ms" } as CSSProperties}>what&apos;s funny.</span>
                </span>
              </h1>

              <div className="fade-up mt-7" style={{ "--d": "420ms" } as CSSProperties}>
                <p className="max-w-xl text-[1.15rem] leading-relaxed text-muted">
                  Post a meme, or a photo from your week in New York and let AI write
                  three captions for it. Everyone votes, and the best caption each day
                  is Caption of the Day.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/rate" className={btnPrimary}>
                    Start rating
                  </Link>
                  <Link href="/create" className={btnSecondary}>
                    Caption a photo with AI
                  </Link>
                  <Link href="/create?mode=meme" className={btnSecondary}>
                    Make a meme
                  </Link>
                </div>

                {viewer ? (
                  <p className="mt-7 max-w-xl text-muted">
                    {isProfileComplete(viewer.profile) ? (
                      <>Welcome back, {viewer.profile!.first_name}. </>
                    ) : (
                      <>
                        Almost there:{" "}
                        <Link href="/onboarding" className={textLink}>
                          add your name
                        </Link>{" "}
                        to finish setting up.{" "}
                      </>
                    )}
                    {unrated === null ? null : unrated > 0 ? (
                      <Link href="/rate?tab=new" className={`${textLink} text-ink`}>
                        {unrated} new {unrated === 1 ? "post is" : "posts are"} waiting for your vote
                      </Link>
                    ) : (
                      "You're all caught up. Post something to keep it going."
                    )}
                  </p>
                ) : (
                  <>
                    <ol className="mt-8 grid max-w-xl gap-3.5">
                      {STEPS.map(([title, body], index) => (
                        <li key={title} className="flex items-start gap-3.5">
                          <Bullet color="red" className="mt-0.5 text-[1.25rem]">
                            {index + 1}
                          </Bullet>
                          <span>
                            <span className="block text-[1.05rem] font-bold">{title}</span>
                            <span className="block text-muted">{body}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-6 text-muted">
                      Anyone can look.{" "}
                      <Link href="/login?next=/rate" className={`${textLink} text-ink`}>
                        Sign in with Google
                      </Link>{" "}
                      to vote and post.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="fade-up mx-auto w-full max-w-md lg:mt-3" style={{ "--d": "520ms" } as CSSProperties}>
              <HeroReel slides={reel} />
            </div>
          </div>
        </section>

        <CaptionTicker lines={allTime.map((caption) => caption.text)} />

        <div className="mx-auto w-full max-w-6xl px-4 pb-6">
          <section className="mt-14">
            <SectionTitle title="Caption of the Day" aside={dateLabel} />
            {captionOfTheDay ? (
              <CaptionOfTheDay caption={captionOfTheDay} />
            ) : (
              <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-rule bg-surface p-7 sm:p-9">
                <p className="display text-[2rem]">Nobody has won today yet</p>
                <p className="max-w-lg text-muted">
                  Post a photo or upvote today&apos;s captions to crown one. It resets at
                  midnight.
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <Link href="/create" className={btnPrimary}>
                    Post today&apos;s first photo
                  </Link>
                  <Link href="/rate" className={btnSecondary}>
                    Go vote
                  </Link>
                </div>
              </div>
            )}
          </section>

          <div className="mt-14 grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <section>
              <SectionTitle title={week.length > 0 ? "Top this week" : "All-time favorites"} />
              {board.length > 0 ? (
                <ol className="sign sign-line mt-4 overflow-hidden rounded-2xl pt-3">
                  {board.map((caption, index) => (
                    <li key={caption.id} className="border-t border-sign-rule first:border-0">
                      <Link
                        href={`/p/${caption.generations.id}`}
                        className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.07] sm:px-5"
                      >
                        <Bullet color={RANK_COLORS[index] ?? "gray"} className="text-[1.25rem]">
                          {index + 1}
                        </Bullet>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl(caption.generations.image_path)}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="joke line-clamp-2 text-[1.05rem] leading-snug">
                            &ldquo;{caption.text}&rdquo;
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-sign-muted">
                            {[caption.generations.location, caption.generations.author_name]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </span>
                        <span className="display shrink-0 text-[1.9rem] tabular-nums text-yellow">
                          +{caption.score}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-muted">
                  No votes yet.{" "}
                  <Link href="/rate" className={`${textLink} text-ink`}>
                    Go rate some captions
                  </Link>
                </p>
              )}
            </section>

            <section>
              <SectionTitle
                title="Top memes"
                aside={
                  <Link href="/rate?tab=memes" className={`${textLink} text-ink`}>
                    All memes
                  </Link>
                }
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                {topMemes.map((meme) => (
                  <Link
                    key={meme.id}
                    href={`/m/${meme.id}`}
                    className="group overflow-hidden rounded-2xl border border-rule bg-surface transition-colors hover:border-ink"
                  >
                    <ViewTransition name={`meme-${meme.id}`} share="morph" default="none">
                      <div>
                        <MemeImage
                          src={memeImageUrl(meme)}
                          alt={meme.title}
                          topText={meme.top_text}
                          bottomText={meme.bottom_text}
                          variant="thumb"
                        />
                      </div>
                    </ViewTransition>
                    <span className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="truncate text-sm font-bold">{meme.title}</span>
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          meme.score > 0 ? "text-up" : meme.score < 0 ? "text-down" : "text-muted"
                        }`}
                      >
                        {meme.score > 0 ? `+${meme.score}` : meme.score}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </ViewTransition>
  );
}

function SectionTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="display text-[2.2rem] sm:text-[2.6rem]">{title}</h2>
      {aside && <span className="text-sm text-muted">{aside}</span>}
    </div>
  );
}

function CaptionOfTheDay({ caption }: { caption: RankedCaption }) {
  const { generations: generation } = caption;
  return (
    <Link
      href={`/p/${generation.id}`}
      className="group mt-4 grid overflow-hidden rounded-2xl bg-yellow text-black sm:grid-cols-[5fr_6fr]"
    >
      <ViewTransition name={`photo-${generation.id}`} share="morph" default="none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl(generation.image_path)}
          alt={generation.location ? `Photo from ${generation.location}` : "Winning photo"}
          className="aspect-[4/3] h-full w-full bg-black object-cover"
        />
      </ViewTransition>
      <div className="flex flex-col justify-center gap-4 p-6 sm:p-9">
        <span
          className="bullet text-[1.5rem]"
          style={{ "--b": "#000", "--bt": "var(--yellow)" } as CSSProperties}
        >
          <Crown className="h-[0.95em] w-[0.95em]" />
        </span>
        <p className="joke text-[1.7rem] leading-tight sm:text-[2.2rem]">&ldquo;{caption.text}&rdquo;</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          {generation.location && (
            <span className="inline-flex items-center gap-1">
              <Pin />
              {generation.location}
            </span>
          )}
          {generation.author_name && <span>by {generation.author_name}</span>}
        </p>
        <p className="flex items-baseline gap-3">
          <span className="display text-[2.6rem] tabular-nums">+{caption.score}</span>
          <span className="text-sm font-medium">
            {caption.upvotes} up, {caption.downvotes} down
          </span>
        </p>
      </div>
    </Link>
  );
}
