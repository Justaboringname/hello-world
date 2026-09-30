"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/profile";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export function NameForm({
  action,
  defaultFirstName,
  defaultLastName,
  submitLabel,
  next,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaultFirstName: string;
  defaultLastName: string;
  submitLabel: string;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          First name
          <input
            name="first_name"
            defaultValue={defaultFirstName}
            required
            maxLength={50}
            autoComplete="given-name"
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Last name
          <input
            name="last_name"
            defaultValue={defaultLastName}
            required
            maxLength={50}
            autoComplete="family-name"
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton
          pendingLabel="Saving…"
          className="bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
        >
          {submitLabel}
        </SubmitButton>
        {state.message && (
          <p
            role="status"
            className={
              state.status === "error" ? "text-sm text-red-600" : "text-sm text-green-600"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
