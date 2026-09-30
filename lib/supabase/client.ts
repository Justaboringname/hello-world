import { createBrowserClient } from "@supabase/ssr";

// Auth-aware client for Client Components. It shares the session cookies
// written by the server client, so uploads run as the signed-in user.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
