"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { submitDuel } from "@/app/duel/actions";
import { DUEL_MAX_LENGTH } from "@/lib/duel";
import type { FormState } from "@/lib/profile";

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

  const left = DUEL_MAX_LENGTH - text.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="generation_id" value={generationId} />
      <label className="text-sm font-medium" htmlFor="duel-caption">
        Your caption{" "}
        <span className="font-normal text-zinc-500">
          ({triesLeft} {triesLeft === 1 ? "try" : "tries"} left)
        </span>
      </label>
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
        disabled={pending}
        placeholder="One line. Make it about this photo."
        className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs tabular-nums ${left < 10 ? "text-amber-600" : "text-zinc-500"}`}>
          {left} characters left
        </span>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "The judge is reading…" : "🤖 Duel the bot"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
