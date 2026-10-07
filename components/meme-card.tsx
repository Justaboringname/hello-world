import { MemeImage } from "@/components/meme-image";
import { VoteButtons } from "@/components/vote-buttons";
import type { Meme, VoteValue } from "@/lib/captions";
import { memeImageUrl } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

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
      <MemeImage
        src={memeImageUrl(meme)}
        alt={meme.title}
        topText={meme.top_text}
        bottomText={meme.bottom_text}
      />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{meme.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {meme.image_path ? (
              <span>
                😂 Meme by {meme.author_name ?? "a member"} · {timeAgo(meme.created_at)}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                😂 Classic meme
              </span>
            )}
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
