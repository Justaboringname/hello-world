"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { castVote, type VoteTarget } from "@/app/rate/actions";
import type { VoteValue } from "@/lib/captions";

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

// 👍 score 👎 for one caption or meme. Clicking your current vote takes it
// back; clicking the other one flips it. Signed-out visitors get links to
// sign in instead of buttons.
export function VoteButtons({
  target,
  id,
  upvotes,
  downvotes,
  myVote,
  signedIn,
  loginHref,
}: {
  target: VoteTarget;
  id: number;
  upvotes: number;
  downvotes: number;
  myVote: VoteValue | null;
  signedIn: boolean;
  loginHref: string;
}) {
  const [tally, setTally] = useState<Tally>({ upvotes, downvotes, myVote });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const score = tally.upvotes - tally.downvotes;

  function vote(value: VoteValue) {
    const previous = tally;
    const next = tally.myVote === value ? null : value;
    setError(null);
    setTally(applyVote(tally, next));

    startTransition(async () => {
      const result = await castVote(target, id, next);
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
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div
        className="flex items-center gap-1.5"
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
      {error && (
        <p role="alert" className="text-right text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
