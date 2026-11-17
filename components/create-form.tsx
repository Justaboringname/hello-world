"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createGeneration } from "@/app/create/actions";
import { Bullet } from "@/components/bullet";
import { Camera } from "@/components/icons";
import { LOCATION_MAX_LENGTH, VIBES, type Vibe } from "@/lib/captions";
import type { FormState } from "@/lib/profile";
import { resizeImage } from "@/lib/resize-image";
import { btnPrimary, errorText, field } from "@/lib/ui";

// What the wait looks like from the outside, a few seconds each. The request
// is one call; these only pace the wait.
const WRITING_STEPS = [
  "Looking at your photo",
  "Finding what's funny in it",
  "Writing caption 1 of 3",
  "Writing caption 2 of 3",
  "Writing caption 3 of 3",
  "Picking the best wording",
];

// The three captions, taking shape under the photo while the AI writes.
export function WritingPanel({ step }: { step: number }) {
  return (
    <div className="mt-3 rounded-2xl border border-rule bg-surface px-5 py-4" role="status">
      <p className="caret font-bold">{WRITING_STEPS[step]}</p>
      <div className="mt-3.5 space-y-3" aria-hidden>
        {[88, 72, 80].map((width, index) => (
          <div
            key={index}
            className={`h-4 rounded-full ${step >= index + 2 ? "shimmer" : "bg-rule/60"}`}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CreateForm({ remaining }: { remaining: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [vibe, setVibe] = useState<Vibe>("midwest");
  const [state, formAction, pending] = useActionState(createGeneration, {
    status: "idle",
  } satisfies FormState);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // While the AI writes, step through what it is doing.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(
      () => setStep((current) => Math.min(current + 1, WRITING_STEPS.length - 1)),
      2600,
    );
    return () => {
      clearInterval(timer);
      setStep(0);
    };
  }, [pending]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    try {
      const resized = await resizeImage(file);
      setPhoto(resized);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      setPhotoError("Couldn't read that photo. Try a JPEG or PNG.");
    }
  }

  // Submitted by hand (not <form action>) so a failed attempt keeps the photo
  // and inputs instead of resetting the form.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      setPhotoError("Pick a photo first.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("photo", photo);
    startTransition(() => formAction(formData));
  }

  const outOfGenerations = remaining <= 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePhoto}
        className="hidden"
      />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={`group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl text-muted transition-colors disabled:cursor-wait ${
            previewUrl
              ? "border border-rule bg-black"
              : "border-2 border-dashed border-rule bg-surface hover:border-ink hover:text-ink"
          } ${pending ? "scan" : ""}`}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Your photo" className="h-full w-full object-contain" />
              {!pending && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-sm font-semibold text-white transition group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                  Change photo
                </span>
              )}
            </>
          ) : (
            <span className="flex flex-col items-center gap-2 px-6 text-center">
              <Camera className="h-10 w-10" />
              <span className="text-[1.1rem] font-bold text-ink">Choose a photo</span>
              <span className="max-w-sm text-sm">
                Something you saw in the city this week: a bodega cat, a subway
                moment, the dining hall at its worst.
              </span>
            </span>
          )}
        </button>

        {pending && <WritingPanel step={step} />}
        {photoError && (
          <p role="alert" className={`mt-2 ${errorText}`}>
            {photoError}
          </p>
        )}
      </div>

      <fieldset disabled={pending}>
        <legend className="font-bold">Pick a vibe</legend>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(VIBES) as Vibe[]).map((key) => (
            <label
              key={key}
              className={`key flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] bg-surface p-3.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                vibe === key
                  ? "translate-y-[3px] border-ink"
                  : "border-rule shadow-[0_3px_0_var(--rule)] hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="vibe"
                value={key}
                checked={vibe === key}
                onChange={() => setVibe(key)}
                className="sr-only"
              />
              <Bullet color={VIBES[key].bullet.color} className="text-[1.5rem]">
                {VIBES[key].bullet.glyph}
              </Bullet>
              <span>
                <span className="block font-bold">{VIBES[key].label}</span>
                <span className="block text-sm text-muted">{VIBES[key].blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="font-bold">
        Where was this? <span className="font-normal text-muted">(optional)</span>
        <input
          name="location"
          maxLength={LOCATION_MAX_LENGTH}
          placeholder="e.g. Washington Square Park"
          className={field}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending || outOfGenerations} className={btnPrimary}>
          {pending ? "The AI is writing…" : "Generate captions"}
        </button>
        <p className="text-sm text-muted">
          {outOfGenerations
            ? "You've hit today's limit. Come back tomorrow."
            : `${remaining} left today`}
        </p>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className={errorText}>
          {state.message}
        </p>
      )}
    </form>
  );
}
