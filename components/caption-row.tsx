import { VoteButtons } from "@/components/vote-buttons";
import type { Caption, VoteValue } from "@/lib/captions";

export function CaptionRow({
  caption,
  myVote,
  signedIn,
  loginHref,
  isTop,
}: {
  caption: Caption;
  myVote: VoteValue | null;
  signedIn: boolean;
  loginHref: string;
  isTop: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <p className="flex-1 text-base leading-snug">
        {isTop && (
          <span className="mr-1" title="Top caption on this photo">
            👑
          </span>
        )}
        {caption.text}
      </p>
      <VoteButtons
        target="caption"
        id={caption.id}
        upvotes={caption.upvotes}
        downvotes={caption.downvotes}
        myVote={myVote}
        signedIn={signedIn}
        loginHref={loginHref}
      />
    </li>
  );
}
