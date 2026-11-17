import Link from "next/link";
import { ViewTransition } from "react";
import { Pin } from "@/components/icons";
import { ImageBackdrop } from "@/components/image-backdrop";
import { VibeBadge } from "@/components/vibe-badge";
import { CaptionBallot } from "@/components/vote";
import type { Generation, VoteValue } from "@/lib/captions";
import { photoUrl } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

// One photo with its three AI captions and their votes. In the feed the photo
// links to its own page, and morphs into place there.
export function GenerationCard({
  generation,
  votes,
  signedIn,
  loginHref,
  linkToDetail = true,
  reveal = false,
}: {
  generation: Generation;
  votes: Map<number, VoteValue>;
  signedIn: boolean;
  loginHref: string;
  linkToDetail?: boolean;
  // Print the captions in one by one (right after they were generated).
  reveal?: boolean;
}) {
  const detailHref = `/p/${generation.id}`;
  const src = photoUrl(generation.image_path);
  const photo = (
    <ViewTransition name={`photo-${generation.id}`} share="morph" default="none">
      <div className="relative overflow-hidden bg-black">
        <ImageBackdrop src={src} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={generation.location ? `Photo from ${generation.location}` : "User photo"}
          loading="lazy"
          className="relative max-h-[34rem] w-full object-contain"
        />
      </div>
    </ViewTransition>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-rule bg-surface">
      {linkToDetail ? (
        <Link href={detailHref} className="block">
          {photo}
        </Link>
      ) : (
        photo
      )}

      <div className="px-4 pb-1 pt-4 sm:px-5">
        <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-sm text-muted">
          <VibeBadge vibe={generation.vibe} />
          {generation.location && (
            <span className="inline-flex items-center gap-1">
              <Pin />
              {generation.location}
            </span>
          )}
          <span>{generation.author_name ? `by ${generation.author_name}` : "anonymous"}</span>
          {linkToDetail ? (
            <Link href={detailHref} className="hover:text-ink hover:underline">
              {timeAgo(generation.created_at)}
            </Link>
          ) : (
            <span>{timeAgo(generation.created_at)}</span>
          )}
        </p>

        <p className="mt-3 text-sm text-muted">
          The AI wrote these three. Vote for the ones that made you laugh.
        </p>
        <CaptionBallot
          captions={generation.captions}
          myVotes={Object.fromEntries(votes)}
          signedIn={signedIn}
          loginHref={loginHref}
          reveal={reveal}
        />
      </div>
    </article>
  );
}
