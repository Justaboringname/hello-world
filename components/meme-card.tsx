import Link from "next/link";
import { ViewTransition } from "react";
import { Bullet } from "@/components/bullet";
import { Lock } from "@/components/icons";
import { MemeImage } from "@/components/meme-image";
import { MemeVote } from "@/components/vote";
import type { Meme, VoteValue } from "@/lib/captions";
import { memeImageUrl } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

export function MemeCard({
  meme,
  myVote,
  signedIn,
  loginHref,
  linkToDetail = true,
}: {
  meme: Meme;
  myVote: VoteValue | null;
  signedIn: boolean;
  loginHref: string;
  linkToDetail?: boolean;
}) {
  const detailHref = `/m/${meme.id}`;
  const image = (
    <ViewTransition name={`meme-${meme.id}`} share="morph" default="none">
      <div>
        <MemeImage
          src={memeImageUrl(meme)}
          alt={meme.title}
          topText={meme.top_text}
          bottomText={meme.bottom_text}
        />
      </div>
    </ViewTransition>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-rule bg-surface">
      {linkToDetail ? (
        <Link href={detailHref} className="block">
          {image}
        </Link>
      ) : (
        image
      )}
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          {linkToDetail ? (
            <Link href={detailHref} className="text-[1.05rem] font-bold hover:underline">
              {meme.title}
            </Link>
          ) : (
            <p className="text-[1.05rem] font-bold">{meme.title}</p>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>
              {meme.image_path
                ? `Meme by ${meme.author_name ?? "a member"}, ${timeAgo(meme.created_at)}`
                : "Classic meme"}
            </span>
            {meme.members_only && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <Bullet color="blue" className="text-[0.8rem]">
                  <Lock className="h-[0.9em] w-[0.9em]" />
                </Bullet>
                Members only
              </span>
            )}
          </p>
        </div>
        <MemeVote
          id={meme.id}
          upvotes={meme.upvotes}
          downvotes={meme.downvotes}
          myVote={myVote}
          signedIn={signedIn}
          loginHref={loginHref}
        />
      </div>
    </article>
  );
}
