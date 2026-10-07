import "server-only";
import { cache } from "react";
import {
  PHOTO_BUCKET,
  type Caption,
  type Generation,
  type GenerationDetail,
  type VoteValue,
} from "@/lib/captions";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Read helpers for the caption pages. They use the auth-aware client, so RLS
// decides what comes back: everyone sees photos and totals, and only signed-in
// users get their own votes.

export const FEED_PAGE_SIZE = 12;

const GENERATION_COLUMNS =
  "id, author_name, image_path, location, vibe, created_at, captions(id, position, text, upvotes, downvotes, score)";

// The photos bucket is public, so the URL can be built without a request.
export function photoUrl(path: string) {
  return `${supabaseEnv().url}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

function sortCaptions<T extends Generation>(generation: T): T {
  return {
    ...generation,
    captions: [...generation.captions].sort((a, b) => a.position - b.position),
  };
}

export async function getFeed(page: number) {
  const supabase = await createClient();
  const from = page * FEED_PAGE_SIZE;
  // Ask for one extra row to know whether there is another page.
  const { data, error } = await supabase
    .from("generations")
    .select(GENERATION_COLUMNS)
    .order("created_at", { ascending: false })
    .range(from, from + FEED_PAGE_SIZE);

  const rows = ((data ?? []) as Generation[]).map(sortCaptions);
  return {
    error,
    generations: rows.slice(0, FEED_PAGE_SIZE),
    hasMore: rows.length > FEED_PAGE_SIZE,
  };
}

// Cached per request so generateMetadata and the page share one query.
export const getGeneration = cache(async (id: number) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select(`${GENERATION_COLUMNS}, system_prompt, prompt, model`)
    .eq("id", id)
    .maybeSingle<GenerationDetail>();
  return data ? sortCaptions(data) : null;
});

// The signed-in user's votes on these captions. RLS only returns their own
// rows; signed-out callers get an empty map.
export async function getMyVotes(userId: string | undefined, captionIds: number[]) {
  const votes = new Map<number, VoteValue>();
  if (!userId || captionIds.length === 0) return votes;

  const supabase = await createClient();
  const { data } = await supabase
    .from("caption_votes")
    .select("caption_id, vote")
    .eq("user_id", userId)
    .in("caption_id", captionIds);
  for (const row of data ?? []) votes.set(row.caption_id, row.vote);
  return votes;
}

export type RankedCaption = Caption & {
  generations: Pick<Generation, "id" | "image_path" | "author_name" | "location" | "created_at">;
};

// Highest-scoring captions on photos posted since `since`. Only captions with
// a positive score make the board.
export async function getTopCaptions(since: Date, limit: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("captions")
    .select(
      "id, position, text, upvotes, downvotes, score, generations!inner(id, image_path, author_name, location, created_at)",
    )
    .gte("generations.created_at", since.toISOString())
    .gt("score", 0)
    .order("score", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  return (data ?? []) as unknown as RankedCaption[];
}

// How many captions this user hasn't voted on yet.
export async function getUnratedCount(userId: string) {
  const supabase = await createClient();
  const [captions, votes] = await Promise.all([
    supabase.from("captions").select("id", { count: "exact", head: true }),
    supabase
      .from("caption_votes")
      .select("caption_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return Math.max(0, (captions.count ?? 0) - (votes.count ?? 0));
}

// Photos this user captioned in the last 24 hours (for the daily limit).
export async function countRecentGenerations(userId: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count ?? 0;
}
