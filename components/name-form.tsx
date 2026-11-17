"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/profile";
import { btnPrimary, field } from "@/lib/ui";

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
    <form action={formAction} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-bold">
          First name
          <input
            name="first_name"
            defaultValue={defaultFirstName}
            required
            maxLength={50}
            autoComplete="given-name"
            className={field}
          />
        </label>
        <label className="font-bold">
          Last name
          <input
            name="last_name"
            defaultValue={defaultLastName}
            required
            maxLength={50}
            autoComplete="family-name"
            className={field}
          />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Saving…" className={btnPrimary}>
          {submitLabel}
        </SubmitButton>
        {state.message && (
          <p
            role="status"
            className={`text-sm font-medium ${state.status === "error" ? "text-down" : "text-up"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
