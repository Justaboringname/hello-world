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
import { createMeme } from "@/app/create/actions";
import { MemeImage } from "@/components/meme-image";
import { MEME_TEXT_MAX_LENGTH, MEME_TITLE_MAX_LENGTH } from "@/lib/captions";
import type { FormState } from "@/lib/profile";
import { resizeImage } from "@/lib/resize-image";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export function MemeForm({ remaining }: { remaining: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [state, formAction, pending] = useActionState(createMeme, {
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
      setPhotoError("Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  // Submitted by hand (not <form action>) so a failed attempt keeps the image
  // and text instead of resetting the form.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      setPhotoError("Pick an image first.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("photo", photo);
    startTransition(() => formAction(formData));
  }

  const outOfMemes = remaining <= 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input ref={inputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="group relative block w-full overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-wait dark:border-zinc-700 dark:bg-zinc-900"
      >
        {previewUrl ? (
          <>
            <MemeImage
              src={previewUrl}
              alt="Your meme"
              topText={topText.trim() || null}
              bottomText={bottomText.trim() || null}
            />
            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-sm text-white opacity-0 transition group-hover:opacity-100">
              Change image
            </span>
          </>
        ) : (
          <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-4xl" aria-hidden>
              🖼️
            </span>
            <span className="font-medium">Choose an image</span>
            <span className="text-sm">
              A photo, a screenshot, or a meme you already made. Add top and
              bottom text below if you like.
            </span>
          </span>
        )}
      </button>
      {photoError && (
        <p role="alert" className="-mt-4 text-sm text-red-600">
          {photoError}
        </p>
      )}

      <label className="text-sm font-medium">
        Title
        <input
          name="title"
          required
          maxLength={MEME_TITLE_MAX_LENGTH}
          placeholder="e.g. Butler at finals week"
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Top text <span className="font-normal text-zinc-500">(optional)</span>
          <input
            name="top_text"
            maxLength={MEME_TEXT_MAX_LENGTH}
            value={topText}
            onChange={(event) => setTopText(event.target.value)}
            placeholder="When the 1 train finally comes"
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Bottom text <span className="font-normal text-zinc-500">(optional)</span>
          <input
            name="bottom_text"
            maxLength={MEME_TEXT_MAX_LENGTH}
            value={bottomText}
            onChange={(event) => setBottomText(event.target.value)}
            placeholder="and it's running local"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || outOfMemes}
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post meme 😂"}
        </button>
        <p className="text-sm text-zinc-500">
          {outOfMemes ? "You've hit today's limit. Come back tomorrow!" : `${remaining} left today`}
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
