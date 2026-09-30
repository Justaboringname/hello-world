import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

// Cookie-less client that always queries as the `anon` role. The memes table
// policy only grants reads to `anon`, so the memes page keeps using this.
export function getSupabase() {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey);
}
