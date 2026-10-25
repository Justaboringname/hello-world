"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { devPasswordLoginEnabled } from "@/lib/auth";
import { NEXT_PATH_COOKIE, safeNextPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

async function requestOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Exactly /auth/callback on whichever deployment the user is on.
      redirectTo: `${await requestOrigin()}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    const message = error?.message ?? "Could not start Google sign-in.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  (await cookies()).set(NEXT_PATH_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  redirect(data.url);
}

// Local development only: sign in a Supabase email/password test user, so a
// local Supabase stack works without a Google OAuth client.
export async function signInWithPassword(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  if (!devPasswordLoginEnabled()) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
