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
import { Picture } from "@/components/icons";
import { MemeImage } from "@/components/meme-image";
import { MEME_TEXT_MAX_LENGTH, MEME_TITLE_MAX_LENGTH } from "@/lib/captions";
import type { FormState } from "@/lib/profile";
import { resizeImage } from "@/lib/resize-image";
import { btnPrimary, errorText, field } from "@/lib/ui";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <input ref={inputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={`group relative block w-full overflow-hidden rounded-2xl text-muted transition-colors disabled:cursor-wait ${
            previewUrl
              ? "border border-rule"
              : "border-2 border-dashed border-rule bg-surface hover:border-ink hover:text-ink"
          }`}
        >
          {previewUrl ? (
            <>
              <MemeImage
                src={previewUrl}
                alt="Your meme"
                topText={topText.trim() || null}
                bottomText={bottomText.trim() || null}
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-sm font-semibold text-white transition group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                Change image
              </span>
            </>
          ) : (
            <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-6 text-center">
              <Picture className="h-10 w-10" />
              <span className="text-[1.1rem] font-bold text-ink">Choose an image</span>
              <span className="max-w-sm text-sm">
                A photo, a screenshot, or a meme you already made. Add top and
                bottom text below if you like.
              </span>
            </span>
          )}
        </button>
        {photoError && (
          <p role="alert" className={`mt-2 ${errorText}`}>
            {photoError}
          </p>
        )}
      </div>

      <label className="font-bold">
        Title
        <input
          name="title"
          required
          maxLength={MEME_TITLE_MAX_LENGTH}
          placeholder="e.g. Butler at finals week"
          className={field}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-bold">
          Top text <span className="font-normal text-muted">(optional)</span>
          <input
            name="top_text"
            maxLength={MEME_TEXT_MAX_LENGTH}
            value={topText}
            onChange={(event) => setTopText(event.target.value)}
            placeholder="When the 1 train finally comes"
            className={field}
          />
        </label>
        <label className="font-bold">
          Bottom text <span className="font-normal text-muted">(optional)</span>
          <input
            name="bottom_text"
            maxLength={MEME_TEXT_MAX_LENGTH}
            value={bottomText}
            onChange={(event) => setBottomText(event.target.value)}
            placeholder="and it's running local"
            className={field}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending || outOfMemes} className={btnPrimary}>
          {pending ? "Posting…" : "Post meme"}
        </button>
        <p className="text-sm text-muted">
          {outOfMemes ? "You've hit today's limit. Come back tomorrow." : `${remaining} left today`}
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
