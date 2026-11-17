"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { castVote, type VoteTarget } from "@/app/rate/actions";
import { Crown, ThumbDown, ThumbUp } from "@/components/icons";
import type { Caption, VoteValue } from "@/lib/captions";
import { errorText } from "@/lib/ui";

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

// The tallies for a group of captions (or one meme), and a vote() that
// updates one right away, then settles on the totals the server returns.
// Clicking your current vote takes it back; clicking the other one flips it.
function useTallies(target: VoteTarget, initial: Record<number, Tally>) {
  const [tallies, setTallies] = useState(initial);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});

  async function vote(id: number, value: VoteValue) {
    const previous = tallies[id];
    if (!previous || busy[id]) return;
    const next = previous.myVote === value ? null : value;
    setErrors((current) => ({ ...current, [id]: "" }));
    setTallies((current) => ({ ...current, [id]: applyVote(previous, next) }));
    setBusy((current) => ({ ...current, [id]: true }));

    let result: Awaited<ReturnType<typeof castVote>>;
    try {
      result = await castVote(target, id, next);
    } catch {
      result = { ok: false, message: "Couldn't save your vote. Try again." };
    }
    setBusy((current) => ({ ...current, [id]: false }));
    if (result.ok) {
      const { upvotes, downvotes, myVote } = result;
      setTallies((current) => ({ ...current, [id]: { upvotes, downvotes, myVote } }));
    } else {
      setTallies((current) => ({ ...current, [id]: previous }));
      setErrors((current) => ({ ...current, [id]: result.message }));
    }
  }

  return { tallies, errors, busy, vote };
}

const voteKey =
  "key relative flex h-10 w-10 items-center justify-center rounded-xl border-[1.5px] text-[1.05rem] disabled:cursor-wait";
const idle =
  "border-rule bg-surface text-muted shadow-[0_3px_0_var(--rule)] hover:border-muted hover:text-ink";
const pressed = "translate-y-[3px] text-white";

// Up, score, down. A vote that lands throws a "HA!" (or a "meh") out of its
// button, and the score rolls to its new value. Signed-out visitors get links
// to sign in instead of buttons.
function VoteControl({
  tally,
  busy,
  signedIn,
  loginHref,
  onVote,
}: {
  tally: Tally;
  busy: boolean;
  signedIn: boolean;
  loginHref: string;
  onVote: (value: VoteValue) => void;
}) {
  const [burst, setBurst] = useState<{ id: number; value: VoteValue } | null>(null);
  const score = tally.upvotes - tally.downvotes;

  function press(value: VoteValue) {
    // Only a vote being cast gets a reaction, not one being taken back.
    setBurst(tally.myVote === value ? null : { id: (burst?.id ?? 0) + 1, value });
    onVote(value);
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      title={`${tally.upvotes} up, ${tally.downvotes} down`}
    >
      {signedIn ? (
        <button
          type="button"
          onClick={() => press(1)}
          disabled={busy}
          aria-pressed={tally.myVote === 1}
          aria-label="Upvote"
          className={`${voteKey} ${tally.myVote === 1 ? `${pressed} border-green bg-green` : idle}`}
        >
          <ThumbUp />
          {burst?.value === 1 && (
            <span key={burst.id} aria-hidden className="ha text-up" onAnimationEnd={() => setBurst(null)}>
              HA!
            </span>
          )}
        </button>
      ) : (
        <Link href={loginHref} aria-label="Sign in to upvote" className={`${voteKey} ${idle}`}>
          <ThumbUp />
        </Link>
      )}

      <span
        aria-label={`Score ${score}`}
        className={`w-9 text-center text-[1.05rem] font-bold tabular-nums ${
          score > 0 ? "text-up" : score < 0 ? "text-down" : "text-muted"
        }`}
      >
        <span key={burst ? score : "initial"} className={burst ? "roll" : undefined}>
          {score > 0 ? `+${score}` : score}
        </span>
      </span>

      {signedIn ? (
        <button
          type="button"
          onClick={() => press(-1)}
          disabled={busy}
          aria-pressed={tally.myVote === -1}
          aria-label="Downvote"
          className={`${voteKey} ${tally.myVote === -1 ? `${pressed} border-red bg-red` : idle}`}
        >
          <ThumbDown />
          {burst?.value === -1 && (
            <span key={burst.id} aria-hidden className="ha text-muted" onAnimationEnd={() => setBurst(null)}>
              meh
            </span>
          )}
        </button>
      ) : (
        <Link href={loginHref} aria-label="Sign in to downvote" className={`${voteKey} ${idle}`}>
          <ThumbDown />
        </Link>
      )}
    </div>
  );
}

// One photo's captions, voted on together: the crown moves to whichever
// caption is ahead as you vote, and the bar under each caption is its share of
// the photo's upvotes. With `reveal`, the captions print in one at a time
// (right after the AI wrote them).
export function CaptionBallot({
  captions,
  myVotes,
  signedIn,
  loginHref,
  reveal = false,
}: {
  captions: Caption[];
  myVotes: Record<number, VoteValue>;
  signedIn: boolean;
  loginHref: string;
  reveal?: boolean;
}) {
  const { tallies, errors, busy, vote } = useTallies(
    "caption",
    Object.fromEntries(
      captions.map((caption) => [
        caption.id,
        { upvotes: caption.upvotes, downvotes: caption.downvotes, myVote: myVotes[caption.id] ?? null },
      ]),
    ),
  );

  const scored = captions.map((caption) => {
    const tally = tallies[caption.id];
    return { caption, tally, score: tally.upvotes - tally.downvotes };
  });
  const totalUpvotes = scored.reduce((sum, row) => sum + row.tally.upvotes, 0);
  // The leader: the highest score, if it is positive and not tied.
  const [first, second] = [...scored].sort((a, b) => b.score - a.score);
  const topId = first && first.score > 0 && (!second || second.score < first.score) ? first.caption.id : null;

  return (
    <ul>
      {scored.map(({ caption, tally }, index) => (
        <li
          key={caption.id}
          className={`relative grid items-center justify-items-end gap-x-4 gap-y-2 pb-4 pt-3.5 sm:grid-cols-[minmax(0,1fr)_auto] ${
            reveal ? "print" : ""
          }`}
          style={reveal ? ({ "--d": `${500 + index * 900}ms` } as CSSProperties) : undefined}
        >
          <p className="joke justify-self-stretch text-[1.2rem] sm:text-[1.3rem]">
            {caption.id === topId && (
              <span
                className="bullet pop mr-2 align-[0.12em] text-[0.72em]"
                style={{ "--b": "var(--accent)", "--bt": "var(--on-accent)" } as CSSProperties}
                title="Top caption on this photo"
              >
                <Crown className="h-[0.95em] w-[0.95em]" />
              </span>
            )}
            &ldquo;{caption.text}&rdquo;
          </p>
          <VoteControl
            tally={tally}
            busy={Boolean(busy[caption.id])}
            signedIn={signedIn}
            loginHref={loginHref}
            onVote={(value) => vote(caption.id, value)}
          />
          {errors[caption.id] && (
            <p role="alert" className={`text-right sm:col-span-2 ${errorText}`}>
              {errors[caption.id]}
            </p>
          )}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-full bg-rule/70">
            <span
              className="block h-full rounded-full bg-green transition-[width] duration-500 ease-out"
              style={{ width: `${totalUpvotes ? (tally.upvotes / totalUpvotes) * 100 : 0}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

// The vote control for one meme.
export function MemeVote({
  id,
  upvotes,
  downvotes,
  myVote,
  signedIn,
  loginHref,
}: {
  id: number;
  upvotes: number;
  downvotes: number;
  myVote: VoteValue | null;
  signedIn: boolean;
  loginHref: string;
}) {
  const { tallies, errors, busy, vote } = useTallies("meme", { [id]: { upvotes, downvotes, myVote } });
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <VoteControl
        tally={tallies[id]}
        busy={Boolean(busy[id])}
        signedIn={signedIn}
        loginHref={loginHref}
        onVote={(value) => vote(id, value)}
      />
      {errors[id] && (
        <p role="alert" className={`text-right ${errorText}`}>
          {errors[id]}
        </p>
      )}
    </div>
  );
}
