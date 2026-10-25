import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DuelForm } from "@/components/duel-form";
import { DuelResultCard } from "@/components/duel-result";
import { ImageBackdrop } from "@/components/image-backdrop";
import { getViewer } from "@/lib/auth";
import { vibeLabel } from "@/lib/captions";
import { TRIES_PER_PHOTO, isDuelOver } from "@/lib/duel";
import { getDailyDuelId, getMyDuels } from "@/lib/duels";
import { getGeneration, photoUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Beat the bot · Hello World",
  description: "Write a funnier caption than Gemini. A blind AI judge decides.",
};

// The judge's Gemini call runs inside this page's Server Action; give it room.
export const maxDuration = 60;

function parseId(value: string | undefined) {
  return value && /^\d{1,15}$/.test(value) ? Number(value) : null;
}

// Beat the Bot: today's photo (or ?photo=<id>), the user's tries on it, and
// the box for the next one. Gemini's captions stay hidden until the duel is
// over, so nobody can just reword the bot's line.
export default async function DuelPage({ searchParams }: PageProps<"/duel">) {
  const requested = parseId(firstParam((await searchParams).photo));
  const id = requested ?? (await getDailyDuelId());
  if (!id) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
        <h1 className="text-4xl font-semibold tracking-tight">🤖 Beat the bot</h1>
        <p className="mt-4 text-zinc-500">
          No photos to duel yet.{" "}
          <Link href="/create" className="text-blue-600 hover:underline">
            Post the first one &rarr;
          </Link>
        </p>
      </main>
    );
  }

  const [viewer, generation] = await Promise.all([getViewer(), getGeneration(id)]);
  if (!generation || generation.captions.length === 0) notFound();
  const tries = await getMyDuels(viewer?.userId, id);
  const over = isDuelOver(tries);
  const latest = tries.at(-1);
  const earlier = tries.slice(0, -1).reverse();
  const played = new Set(tries.map((result) => result.botCaptionId));
  const src = photoUrl(generation.image_path);
  const here = requested ? `/duel?photo=${id}` : "/duel";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 font-sans sm:py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blue-600">
        {requested ? "Beat the bot" : "Today's photo to beat"}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">🤖 Beat the bot</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Write a funnier caption for this photo than Gemini did. A Gemini judge
        reads both lines as A and B without knowing which one is yours, scores
        them, and coaches you. You get {TRIES_PER_PHOTO} tries.
      </p>

      <figure className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-surface shadow-sm dark:border-zinc-800">
        <div className="relative overflow-hidden bg-zinc-900">
          <ImageBackdrop src={src} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={generation.location ? `Photo from ${generation.location}` : "Photo to caption"}
            className="relative max-h-[28rem] w-full object-contain"
          />
        </div>
        <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 text-sm text-zinc-500">
          {generation.location && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">📍 {generation.location}</span>
          )}
          <span>{generation.author_name ? `by ${generation.author_name}` : "anonymous"}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
            Gemini wrote as: {vibeLabel(generation.vibe)}
          </span>
        </figcaption>
      </figure>

      <div className="mt-6 flex flex-col gap-6">
        {latest && <DuelResultCard result={latest} latest />}

        {!over &&
          (viewer ? (
            <div className="rounded-2xl border border-zinc-200 bg-surface p-5 shadow-sm dark:border-zinc-800">
              <DuelForm key={id} generationId={id} triesLeft={TRIES_PER_PHOTO - tries.length} />
            </div>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(here)}`}
              className="self-start rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Sign in to duel the bot
            </Link>
          ))}

        {over && (
          <section className="rounded-2xl border border-zinc-200 bg-surface p-5 shadow-sm dark:border-zinc-800">
            <h2 className="font-semibold">All of Gemini&apos;s captions for this photo</h2>
            <p className="mt-1 text-sm text-zinc-500">
              The bot played the one marked {"🤖"}. Vote on them on the photo&apos;s page.
            </p>
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {generation.captions.map((caption) => (
                <li key={caption.id} className="py-2">
                  {played.has(caption.id) && <span className="mr-1">🤖</span>}
                  {caption.text}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href={`/p/${id}`} className="text-blue-600 hover:underline">
                Vote on this photo &rarr;
              </Link>
              {requested && (
                <Link href="/duel" className="text-blue-600 hover:underline">
                  Play today&apos;s photo &rarr;
                </Link>
              )}
            </div>
          </section>
        )}

        {earlier.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Earlier tries</h2>
            {earlier.map((result) => (
              <DuelResultCard key={result.tryNo} result={result} latest={false} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
