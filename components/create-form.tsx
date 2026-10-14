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
import { LOCATION_MAX_LENGTH, VIBES, type Vibe } from "@/lib/captions";
import type { FormState } from "@/lib/profile";
import { resizeImage } from "@/lib/resize-image";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePhoto}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-surface text-zinc-500 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-wait dark:border-zinc-700"
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Your photo" className="h-full w-full object-contain" />
            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-sm text-white transition group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
              Change photo
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="text-4xl" aria-hidden>
              📸
            </span>
            <span className="font-medium">Choose a photo</span>
            <span className="text-sm">
              Something you saw in the city this week: a bodega cat, a subway
              moment, the dining hall at its worst.
            </span>
          </span>
        )}
      </button>
      {photoError && (
        <p role="alert" className="-mt-4 text-sm text-red-600">
          {photoError}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium">Pick a vibe</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(Object.keys(VIBES) as Vibe[]).map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition has-focus-visible:ring-2 has-focus-visible:ring-blue-500/40 ${
                vibe === key
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-zinc-200 bg-surface hover:border-zinc-400 dark:border-zinc-800"
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
              <span className="text-2xl" aria-hidden>
                {VIBES[key].emoji}
              </span>
              <span>
                <span className="block font-medium">{VIBES[key].label}</span>
                <span className="block text-sm text-zinc-500">{VIBES[key].blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        Where was this? <span className="font-normal text-zinc-500">(optional)</span>
        <input
          name="location"
          maxLength={LOCATION_MAX_LENGTH}
          placeholder="e.g. Washington Square Park"
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || outOfGenerations}
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Gemini is writing captions…" : "Generate captions ✨"}
        </button>
        <p className="text-sm text-zinc-500">
          {outOfGenerations
            ? "You've hit today's limit. Come back tomorrow!"
            : `${remaining} left today`}
        </p>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
