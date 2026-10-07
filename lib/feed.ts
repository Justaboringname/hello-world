import "server-only";
import { cache } from "react";
import {
  PHOTO_BUCKET,
  type Caption,
  type Generation,
  type GenerationDetail,
  type Meme,
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

const MEME_COLUMNS =
  "id, title, image_url, top_text, bottom_text, members_only, upvotes, downvotes, score, created_at";

export type FeedItem =
  | { kind: "photo"; generation: Generation }
  | { kind: "meme"; meme: Meme };

// Photos and memes in one list, newest first. The rate_feed view decides the
// order (and, through RLS, hides members-only memes from signed-out
// visitors); the rows themselves are then loaded per kind.
export async function getRateFeed(page: number) {
  const supabase = await createClient();
  const from = page * FEED_PAGE_SIZE;
  // Ask for one extra row to know whether there is another page.
  const { data: rows, error } = await supabase
    .from("rate_feed")
    .select("kind, id")
    .order("created_at", { ascending: false })
    .order("kind", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + FEED_PAGE_SIZE);
  if (error) return { error, items: [] as FeedItem[], hasMore: false };

  const pageRows = (rows ?? []).slice(0, FEED_PAGE_SIZE);
  const ids = (kind: string) => pageRows.filter((row) => row.kind === kind).map((row) => row.id);
  const [photos, memes] = await Promise.all([
    ids("photo").length
      ? supabase.from("generations").select(GENERATION_COLUMNS).in("id", ids("photo"))
      : { data: [], error: null },
    ids("meme").length
      ? supabase.from("memes").select(MEME_COLUMNS).in("id", ids("meme"))
      : { data: [], error: null },
  ]);
  const loadError = photos.error ?? memes.error;
  if (loadError) return { error: loadError, items: [] as FeedItem[], hasMore: false };

  const photoById = new Map(((photos.data ?? []) as Generation[]).map((g) => [g.id, sortCaptions(g)]));
  const memeById = new Map(((memes.data ?? []) as Meme[]).map((m) => [m.id, m]));
  const items: FeedItem[] = [];
  for (const row of pageRows) {
    if (row.kind === "photo" && photoById.has(row.id)) {
      items.push({ kind: "photo", generation: photoById.get(row.id)! });
    } else if (row.kind === "meme" && memeById.has(row.id)) {
      items.push({ kind: "meme", meme: memeById.get(row.id)! });
    }
  }
  return { error: null, items, hasMore: (rows ?? []).length > FEED_PAGE_SIZE };
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

// The signed-in user's votes on these memes (same rules as getMyVotes).
export async function getMyMemeVotes(userId: string | undefined, memeIds: number[]) {
  const votes = new Map<number, VoteValue>();
  if (!userId || memeIds.length === 0) return votes;

  const supabase = await createClient();
  const { data } = await supabase
    .from("meme_votes")
    .select("meme_id, vote")
    .eq("user_id", userId)
    .in("meme_id", memeIds);
  for (const row of data ?? []) votes.set(row.meme_id, row.vote);
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

// How many captions and memes this user hasn't voted on yet.
export async function getUnratedCount(userId: string) {
  const supabase = await createClient();
  const [captions, captionVotes, memes, memeVotes] = await Promise.all([
    supabase.from("captions").select("id", { count: "exact", head: true }),
    supabase
      .from("caption_votes")
      .select("caption_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("memes").select("id", { count: "exact", head: true }),
    supabase
      .from("meme_votes")
      .select("meme_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return Math.max(
    0,
    (captions.count ?? 0) - (captionVotes.count ?? 0) + (memes.count ?? 0) - (memeVotes.count ?? 0),
  );
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
