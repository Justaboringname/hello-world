import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/profile";

export type Viewer = {
  userId: string;
  email: string | null;
  fullName: unknown;
  profile: Profile | null;
};

// The signed-in user plus their profiles row, or null when signed out.
// Cached per request so the header and the page share one lookup.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle<Profile>();

  return {
    userId: claims.sub,
    email: claims.email ?? null,
    fullName: claims.user_metadata?.full_name,
    profile,
  };
});

// Server-side gate for protected pages. proxy.ts redirects first, but the page
// must not trust that alone.
export async function requireViewer(currentPath: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  return viewer;
}
