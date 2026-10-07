import { VoteButtons } from "@/components/vote-buttons";
import type { Meme, VoteValue } from "@/lib/captions";

const captionClass =
  "absolute inset-x-2 text-center font-black uppercase leading-tight text-white text-2xl [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]";

export function MemeCard({
  meme,
  myVote,
  signedIn,
  loginHref,
}: {
  meme: Meme;
  myVote: VoteValue | null;
  signedIn: boolean;
  loginHref: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative min-h-48 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meme.image_url} alt={meme.title} loading="lazy" className="mx-auto max-h-[32rem] w-full object-contain" />
        {meme.top_text && <p className={`${captionClass} top-2`}>{meme.top_text}</p>}
        {meme.bottom_text && <p className={`${captionClass} bottom-2`}>{meme.bottom_text}</p>}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{meme.title}</p>
          <p className="mt-0.5 flex flex-wrap gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
              😂 Classic meme
            </span>
            {meme.members_only && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                🔓 Members only
              </span>
            )}
          </p>
        </div>
        <VoteButtons
          target="meme"
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
