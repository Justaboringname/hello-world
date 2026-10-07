"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { castVote } from "@/app/rate/actions";
import type { Caption, VoteValue } from "@/lib/captions";

type Tally = { upvotes: number; downvotes: number; myVote: VoteValue | null };

// Apply a vote change locally so the button responds before the server does.
function applyVote(tally: Tally, next: VoteValue | null): Tally {
  let { upvotes, downvotes } = tally;
  if (tally.myVote === 1) upvotes -= 1;
  if (tally.myVote === -1) downvotes -= 1;
  if (next === 1) upvotes += 1;
  if (next === -1) downvotes += 1;
  return { upvotes, downvotes, myVote: next };
}

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
  const [tally, setTally] = useState<Tally>({
    upvotes: caption.upvotes,
    downvotes: caption.downvotes,
    myVote,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const score = tally.upvotes - tally.downvotes;

  function vote(value: VoteValue) {
    const previous = tally;
    const next = tally.myVote === value ? null : value;
    setError(null);
    setTally(applyVote(tally, next));

    startTransition(async () => {
      const result = await castVote(caption.id, next);
      startTransition(() => {
        if (result.ok) {
          setTally({
            upvotes: result.upvotes,
            downvotes: result.downvotes,
            myVote: result.myVote,
          });
        } else {
          setTally(previous);
          setError(result.message);
        }
      });
    });
  }

  const buttonClass =
    "flex h-9 w-9 items-center justify-center rounded-full border text-lg leading-none transition disabled:cursor-wait";
  const idle =
    "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100";

  return (
    <li className="flex items-center gap-3 py-3">
      <p className="flex-1 text-base leading-snug">
        {isTop && (
          <span className="mr-1" title="Top caption on this photo">
            👑
          </span>
        )}
        {caption.text}
        {error && (
          <span role="alert" className="mt-1 block text-sm text-red-600">
            {error}
          </span>
        )}
      </p>

      <div
        className="flex shrink-0 items-center gap-1.5"
        title={`${tally.upvotes} up · ${tally.downvotes} down`}
      >
        {signedIn ? (
          <button
            type="button"
            onClick={() => vote(1)}
            disabled={pending}
            aria-pressed={tally.myVote === 1}
            aria-label="Upvote"
            className={`${buttonClass} ${
              tally.myVote === 1 ? "border-green-600 bg-green-600 text-white" : idle
            }`}
          >
            👍
          </button>
        ) : (
          <Link href={loginHref} aria-label="Sign in to upvote" className={`${buttonClass} ${idle}`}>
            👍
          </Link>
        )}

        <span
          aria-label={`Score ${score}`}
          className={`w-8 text-center text-sm font-semibold tabular-nums ${
            score > 0 ? "text-green-700 dark:text-green-500" : score < 0 ? "text-red-600" : "text-zinc-500"
          }`}
        >
          {score}
        </span>

        {signedIn ? (
          <button
            type="button"
            onClick={() => vote(-1)}
            disabled={pending}
            aria-pressed={tally.myVote === -1}
            aria-label="Downvote"
            className={`${buttonClass} ${
              tally.myVote === -1 ? "border-red-600 bg-red-600 text-white" : idle
            }`}
          >
            👎
          </button>
        ) : (
          <Link href={loginHref} aria-label="Sign in to downvote" className={`${buttonClass} ${idle}`}>
            👎
          </Link>
        )}
      </div>
    </li>
  );
}
