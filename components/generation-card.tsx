import Link from "next/link";
import { CaptionRow } from "@/components/caption-row";
import { ImageBackdrop } from "@/components/image-backdrop";
import { vibeLabel, type Generation, type VoteValue } from "@/lib/captions";
import { photoUrl } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

// The caption with the highest score, if it is positive and not tied.
function topCaptionId(generation: Generation) {
  const [first, second] = [...generation.captions].sort((a, b) => b.score - a.score);
  if (!first || first.score <= 0 || (second && second.score === first.score)) return null;
  return first.id;
}

export function GenerationCard({
  generation,
  votes,
  signedIn,
  loginHref,
  linkToDetail = true,
}: {
  generation: Generation;
  votes: Map<number, VoteValue>;
  signedIn: boolean;
  loginHref: string;
  linkToDetail?: boolean;
}) {
  const detailHref = `/p/${generation.id}`;
  const topId = topCaptionId(generation);
  const src = photoUrl(generation.image_path);
  const photo = (
    <div className="relative overflow-hidden bg-zinc-900">
      <ImageBackdrop src={src} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={generation.location ? `Photo from ${generation.location}` : "User photo"}
        loading="lazy"
        className="relative max-h-[32rem] w-full object-contain"
      />
    </div>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-surface shadow-sm dark:border-zinc-800">
      {linkToDetail ? <Link href={detailHref} className="block">{photo}</Link> : photo}

      <div className="px-4 pb-2 pt-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          {generation.location && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              📍 {generation.location}
            </span>
          )}
          <span>{generation.author_name ? `by ${generation.author_name}` : "anonymous"}</span>
          <span aria-hidden>·</span>
          {linkToDetail ? (
            <Link href={detailHref} className="hover:underline">
              {timeAgo(generation.created_at)}
            </Link>
          ) : (
            <span>{timeAgo(generation.created_at)}</span>
          )}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
            {vibeLabel(generation.vibe)}
          </span>
        </p>

        <p className="mt-3 text-sm text-zinc-500">
          ✨ Gemini&apos;s captions. 👍 the ones that made you laugh:
        </p>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {generation.captions.map((caption) => (
            <CaptionRow
              key={caption.id}
              caption={caption}
              myVote={votes.get(caption.id) ?? null}
              signedIn={signedIn}
              loginHref={loginHref}
              isTop={caption.id === topId}
            />
          ))}
        </ul>
      </div>
    </article>
  );
}
