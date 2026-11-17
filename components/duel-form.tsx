"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { submitDuel } from "@/app/duel/actions";
import { Bullet } from "@/components/bullet";
import { DUEL_MAX_LENGTH, TRIES_PER_PHOTO } from "@/lib/duel";
import type { FormState } from "@/lib/profile";
import { btnPrimary, errorText } from "@/lib/ui";

// What the judge is doing while the player waits, a few seconds each.
const JUDGING_STEPS = [
  "Shuffling your line and the bot's into A and B",
  "The judge is reading both without knowing whose is whose",
  "Scoring each line on five things",
  "Writing notes on your line",
];

// The judge at work: the two lines trading places as A and B.
export function JudgingPanel({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-raised px-4 py-3.5" role="status">
      <span className="flex shrink-0 gap-1.5 text-[1.5rem]" aria-hidden>
        <Bullet color="blue" className="shuffle-a relative">
          A
        </Bullet>
        <Bullet color="orange" className="shuffle-b relative">
          B
        </Bullet>
      </span>
      <p className="caret font-semibold">{JUDGING_STEPS[step]}</p>
    </div>
  );
}

// The one-line caption box. Submitted by hand (not <form action>) so a
// rejected line stays in the box; a judged one clears it.
export function DuelForm({ generationId, triesLeft }: { generationId: number; triesLeft: number }) {
  const [text, setText] = useState("");
  const [state, formAction, pending] = useActionState(submitDuel, {
    status: "idle",
  } satisfies FormState);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await formAction(formData);
    });
  }

  // A judged try clears the box for the next one.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setText("");
  }

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(
      () => setStep((current) => Math.min(current + 1, JUDGING_STEPS.length - 1)),
      3200,
    );
    return () => {
      clearInterval(timer);
      setStep(0);
    };
  }, [pending]);

  const left = DUEL_MAX_LENGTH - text.length;
  const used = TRIES_PER_PHOTO - triesLeft;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="generation_id" value={generationId} />
      <div className="flex items-center justify-between gap-3">
        <label className="font-bold" htmlFor="duel-caption">
          Your caption
        </label>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: TRIES_PER_PHOTO }, (_, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full border-[1.5px] ${
                  index < used ? "border-muted bg-muted" : "border-orange bg-orange"
                }`}
              />
            ))}
          </span>
          {triesLeft} {triesLeft === 1 ? "try" : "tries"} left
        </p>
      </div>
      <textarea
        id="duel-caption"
        name="caption"
        value={text}
        onChange={(event) => setText(event.target.value.replace(/\n/g, " "))}
        onKeyDown={(event) => {
          // An IME is confirming text (Chinese, Japanese, ...), not submitting.
          // keyCode 229 covers Safari, which clears isComposing first.
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        maxLength={DUEL_MAX_LENGTH}
        rows={2}
        // Stays readable (and submitted) while the judge works.
        readOnly={pending}
        placeholder="One line. Make it about this photo."
        className="joke w-full resize-none rounded-xl border-[1.5px] border-rule bg-canvas px-4 py-3 text-[1.3rem] text-ink outline-none placeholder:text-muted/70 focus:border-ink read-only:opacity-70"
      />

      {pending ? (
        <JudgingPanel step={step} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className={`text-sm tabular-nums ${left < 10 ? "font-bold text-down" : "text-muted"}`}>
            {left} characters left
          </span>
          <button type="submit" disabled={!text.trim()} className={btnPrimary}>
            Duel the bot
          </button>
        </div>
      )}
      {state.status === "error" && (
        <p role="alert" className={errorText}>
          {state.message}
        </p>
      )}
    </form>
  );
}
