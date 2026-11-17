import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { DuelForm } from "@/components/duel-form";
import { DuelResultCard } from "@/components/duel-result";
import { Pin } from "@/components/icons";
import { ImageBackdrop } from "@/components/image-backdrop";
import { Page, PageHeader } from "@/components/page";
import { UnfinishedDuels } from "@/components/unfinished-duels";
import { VibeBadge } from "@/components/vibe-badge";
import { getViewer } from "@/lib/auth";
import { TRIES_PER_PHOTO, isDuelOver } from "@/lib/duel";
import { getDailyDuelId, getMyDuels, getMyUnfinishedDuels } from "@/lib/duels";
import { getGeneration, photoUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";
import { btnPrimary, card, textLink } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Beat the bot · Hello World",
  description: "Write a funnier caption than the bot. A blind AI judge decides.",
};

// The judge's Gemini call runs inside this page's Server Action; give it room.
export const maxDuration = 60;

function parseId(value: string | undefined) {
  return value && /^\d{1,15}$/.test(value) ? Number(value) : null;
}

// Beat the Bot: today's photo (or ?photo=<id>), the user's tries on it, and
// the box for the next one. The bot's captions stay hidden until the duel is
// over, so nobody can just reword the bot's line.
export default async function DuelPage({ searchParams }: PageProps<"/duel">) {
  const requested = parseId(firstParam((await searchParams).photo));
  const id = requested ?? (await getDailyDuelId());
  if (!id) {
    return (
      <Page>
        <PageHeader glyph="B" color="orange" title="Beat the bot">
          No photos to duel yet.{" "}
          <Link href="/create" className={`${textLink} text-ink`}>
            Post the first one
          </Link>
        </PageHeader>
      </Page>
    );
  }

  const [viewer, generation] = await Promise.all([getViewer(), getGeneration(id)]);
  if (!generation || generation.captions.length === 0) notFound();
  const [tries, unfinished] = await Promise.all([
    getMyDuels(viewer?.userId, id),
    getMyUnfinishedDuels(viewer?.userId, id),
  ]);
  const over = isDuelOver(tries);
  const latest = tries.at(-1);
  const earlier = tries.slice(0, -1).reverse();
  const played = new Set(tries.map((result) => result.botCaptionId));
  const src = photoUrl(generation.image_path);
  const here = requested ? `/duel?photo=${id}` : "/duel";

  return (
    <Page width="max-w-6xl">
      <PageHeader glyph="B" color="orange" title="Beat the bot">
        Write a funnier caption for this photo than the bot did. A Gemini judge
        reads both lines as A and B without knowing which one is yours, scores
        them, and coaches you. You get {TRIES_PER_PHOTO} tries.
      </PageHeader>

      {unfinished.length > 0 && (
        <div className="mt-7">
          <UnfinishedDuels duels={unfinished} />
        </div>
      )}

      <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10">
        <figure className={`${card} overflow-hidden lg:sticky lg:top-24`}>
          <ViewTransition name={`photo-${id}`} share="morph" default="none">
            <div className="relative overflow-hidden bg-black">
              <ImageBackdrop src={src} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={generation.location ? `Photo from ${generation.location}` : "Photo to caption"}
                className="relative max-h-[30rem] w-full object-contain"
              />
            </div>
          </ViewTransition>
          <figcaption className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-4 py-3.5 text-sm text-muted sm:px-5">
            {!requested && <span className="font-bold text-ink">Today&apos;s photo to beat</span>}
            {generation.location && (
              <span className="inline-flex items-center gap-1">
                <Pin />
                {generation.location}
              </span>
            )}
            <span>{generation.author_name ? `by ${generation.author_name}` : "anonymous"}</span>
            <span className="inline-flex items-center gap-1.5">
              The bot wrote as
              <VibeBadge vibe={generation.vibe} />
            </span>
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-col gap-6">
          {latest && <DuelResultCard result={latest} latest />}

          {!over &&
            (viewer ? (
              <div className={`${card} p-5`}>
                <DuelForm key={id} generationId={id} triesLeft={TRIES_PER_PHOTO - tries.length} />
              </div>
            ) : (
              <div className={`${card} flex flex-col items-start gap-3 p-5`}>
                <p className="text-muted">
                  The bot already wrote its line for this photo. Sign in to write yours.
                </p>
                <Link href={`/login?next=${encodeURIComponent(here)}`} className={btnPrimary}>
                  Sign in to duel the bot
                </Link>
              </div>
            ))}

          {over && (
            <section className={`${card} p-5`}>
              <h2 className="text-[1.05rem] font-bold">All of the bot&apos;s captions for this photo</h2>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                The bot played the one marked
                <span className="h-2.5 w-2.5 rounded-full bg-purple" aria-label="with a purple dot" role="img" />
                . Vote on them on the photo&apos;s page.
              </p>
              <ul className="mt-3 divide-y divide-rule">
                {generation.captions.map((caption) => (
                  <li key={caption.id} className="joke flex items-baseline gap-2.5 py-2.5 text-[1.15rem]">
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${played.has(caption.id) ? "bg-purple" : ""}`}
                    />
                    <span>&ldquo;{caption.text}&rdquo;</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link href={`/p/${id}`} className={textLink}>
                  Vote on this photo
                </Link>
                {requested && (
                  <Link href="/duel" className={textLink}>
                    Play today&apos;s photo
                  </Link>
                )}
              </div>
            </section>
          )}

          {earlier.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="display text-[1.7rem]">Earlier tries</h2>
              {earlier.map((result) => (
                <DuelResultCard key={result.tryNo} result={result} latest={false} />
              ))}
            </section>
          )}
        </div>
      </div>
    </Page>
  );
}
