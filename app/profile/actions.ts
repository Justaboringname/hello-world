"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AVATAR_BUCKET,
  avatarPath,
  parseNames,
  type FormState,
} from "@/lib/profile";
import { safeNextPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

async function signedInClient(returnTo: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return { supabase, claims: data.claims };
}

// Upsert rather than update, so a user whose row the trigger missed still
// gets one. RLS limits every write to the caller's own row.
async function saveProfile(
  returnTo: string,
  fields: Record<string, string | null>,
): Promise<FormState> {
  const { supabase, claims } = await signedInClient(returnTo);
  const { error } = await supabase.from("profiles").upsert({
    id: claims.sub,
    email: claims.email ?? null,
    ...fields,
    updated_at: new Date().toISOString(),
  });

  if (error) return { status: "error", message: error.message };
  revalidatePath("/", "layout");
  return { status: "success" };
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const names = parseNames(formData);
  if (!names.ok) return { status: "error", message: names.message };

  const result = await saveProfile("/profile", {
    first_name: names.firstName,
    last_name: names.lastName,
  });
  return result.status === "success"
    ? { status: "success", message: "Profile saved." }
    : result;
}

export async function completeOnboarding(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const names = parseNames(formData);
  if (!names.ok) return { status: "error", message: names.message };

  const result = await saveProfile("/onboarding", {
    first_name: names.firstName,
    last_name: names.lastName,
  });
  if (result.status === "error") return result;

  redirect(safeNextPath(formData.get("next")));
}

// Called after the browser has uploaded the file to Storage. Only the public
// URL is stored in Postgres, never the image bytes.
export async function saveAvatar(): Promise<FormState> {
  const { supabase, claims } = await signedInClient("/profile");
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath(claims.sub));

  // The path never changes, so a version param busts the browser/CDN cache.
  const result = await saveProfile("/profile", {
    avatar_url: `${publicUrl}?v=${Date.now()}`,
  });
  return result.status === "success"
    ? { status: "success", message: "Photo updated." }
    : result;
}
