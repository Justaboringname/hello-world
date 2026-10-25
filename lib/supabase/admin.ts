import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

// Service-role client: bypasses RLS. Only for writes the user must not be
// able to make themselves (recording a duel verdict). Never import this into
// anything that runs in the browser, and never use it to read on a user's
// behalf; use the auth-aware client in ./server for that.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;
  return createClient(supabaseEnv().url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
