"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { saveAvatar } from "@/app/profile/actions";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  avatarPath,
  type FormState,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { btnSecondary } from "@/lib/ui";

// Uploads straight from the browser to Supabase Storage (no size limit from a
// Server Function body), then asks the server to record the public URL.
export function AvatarUploader({ userId }: { userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setState({ status: "error", message: "Please choose a PNG, JPEG, WebP or GIF image." });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setState({ status: "error", message: "Please choose an image under 5 MB." });
      return;
    }

    startTransition(async () => {
      const { error } = await createClient()
        .storage.from(AVATAR_BUCKET)
        .upload(avatarPath(userId), file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      const result: FormState = error
        ? { status: "error", message: `Upload failed: ${error.message}` }
        : await saveAvatar();
      startTransition(() => setState(result));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={`${btnSecondary} w-fit`}
      >
        {pending ? "Uploading…" : "Upload new photo"}
      </button>
      <p className="mt-1 text-xs text-muted">PNG, JPEG, WebP or GIF, up to 5 MB.</p>
      {state.message && (
        <p
          role="status"
          className={`text-sm font-medium ${state.status === "error" ? "text-down" : "text-up"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
