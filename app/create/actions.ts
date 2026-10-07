"use server";

import { redirect } from "next/navigation";
import {
  DAILY_GENERATION_LIMIT,
  DAILY_MEME_LIMIT,
  LOCATION_MAX_LENGTH,
  MEME_TEXT_MAX_LENGTH,
  MEME_TITLE_MAX_LENGTH,
  PHOTO_BUCKET,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  isVibe,
  photoPath,
} from "@/lib/captions";
import { countRecentGenerations, countRecentMemes } from "@/lib/feed";
import { CaptionError, generateCaptions } from "@/lib/gemini";
import type { FormState } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

// Photo in, captions out: ask Gemini first (so a failure leaves nothing
// behind), then store the photo and save everything in one transaction.
export async function createGeneration(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/create");
  const userId = data.claims.sub;

  const photo = formData.get("photo");
  const vibe = formData.get("vibe");
  const location =
    String(formData.get("location") ?? "")
      .replace(/\s+/g, " ")
      .trim() || null;

  if (!(photo instanceof File) || photo.size === 0) {
    return { status: "error", message: "Please choose a photo." };
  }
  if (!PHOTO_TYPES.includes(photo.type) || photo.size > PHOTO_MAX_BYTES) {
    return { status: "error", message: "Please choose a JPEG, PNG or WebP photo under 3 MB." };
  }
  if (!isVibe(vibe)) {
    return { status: "error", message: "Please pick a vibe." };
  }
  if (location && location.length > LOCATION_MAX_LENGTH) {
    return {
      status: "error",
      message: `Keep the location under ${LOCATION_MAX_LENGTH} characters.`,
    };
  }

  if ((await countRecentGenerations(userId)) >= DAILY_GENERATION_LIMIT) {
    return {
      status: "error",
      message: `You've captioned ${DAILY_GENERATION_LIMIT} photos in the last 24 hours. Go rate some captions and come back tomorrow!`,
    };
  }

  const image = Buffer.from(await photo.arrayBuffer());
  let result;
  try {
    result = await generateCaptions({ image, mimeType: photo.type, vibe, location });
  } catch (error) {
    if (error instanceof CaptionError) return { status: "error", message: error.message };
    throw error;
  }

  const path = photoPath(userId, photo.type);
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, image, { contentType: photo.type, cacheControl: "31536000" });
  if (uploadError) {
    return { status: "error", message: `Upload failed: ${uploadError.message}` };
  }

  const { data: generationId, error } = await supabase.rpc("create_generation", {
    image_path: path,
    location,
    vibe,
    system_prompt: result.systemPrompt,
    prompt: result.prompt,
    model: result.model,
    captions: result.captions,
  });
  if (error) return { status: "error", message: `Could not save: ${error.message}` };

  redirect(`/p/${generationId}`);
}

function oneLine(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

// A meme someone made themselves: their image plus optional top and bottom
// text. It goes straight into the memes table and the /rate feed.
export async function createMeme(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(`/login?next=${encodeURIComponent("/create?mode=meme")}`);
  const userId = data.claims.sub;

  const photo = formData.get("photo");
  const title = oneLine(formData.get("title"));
  const topText = oneLine(formData.get("top_text")) || null;
  const bottomText = oneLine(formData.get("bottom_text")) || null;

  if (!(photo instanceof File) || photo.size === 0) {
    return { status: "error", message: "Please choose an image." };
  }
  if (!PHOTO_TYPES.includes(photo.type) || photo.size > PHOTO_MAX_BYTES) {
    return { status: "error", message: "Please choose a JPEG, PNG or WebP image under 3 MB." };
  }
  if (!title) return { status: "error", message: "Give your meme a title." };
  if (title.length > MEME_TITLE_MAX_LENGTH) {
    return { status: "error", message: `Keep the title under ${MEME_TITLE_MAX_LENGTH} characters.` };
  }
  if ((topText?.length ?? 0) > MEME_TEXT_MAX_LENGTH || (bottomText?.length ?? 0) > MEME_TEXT_MAX_LENGTH) {
    return { status: "error", message: `Keep each line under ${MEME_TEXT_MAX_LENGTH} characters.` };
  }
  if ((await countRecentMemes(userId)) >= DAILY_MEME_LIMIT) {
    return {
      status: "error",
      message: `You've posted ${DAILY_MEME_LIMIT} memes in the last 24 hours. Come back tomorrow!`,
    };
  }

  const path = photoPath(userId, photo.type);
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, Buffer.from(await photo.arrayBuffer()), {
      contentType: photo.type,
      cacheControl: "31536000",
    });
  if (uploadError) return { status: "error", message: `Upload failed: ${uploadError.message}` };

  const { error } = await supabase.from("memes").insert({
    user_id: userId,
    title,
    image_path: path,
    top_text: topText,
    bottom_text: bottomText,
  });
  if (error) return { status: "error", message: `Could not save: ${error.message}` };

  redirect("/rate?tab=memes");
}
