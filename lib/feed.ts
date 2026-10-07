import "server-only";
import { cache } from "react";
import {
  PHOTO_BUCKET,
  type Caption,
  type Generation,
  type GenerationDetail,
  type Meme,
  type RateTab,
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
  "id, title, image_url, image_path, top_text, bottom_text, members_only, author_name, upvotes, downvotes, score, created_at";

export function memeImageUrl(meme: Pick<Meme, "image_url" | "image_path">) {
  return meme.image_path ? photoUrl(meme.image_path) : (meme.image_url ?? "");
}

export type FeedItem =
  | { kind: "photo"; generation: Generation }
  | { kind: "meme"; meme: Meme };

const TAB_KIND = { memes: "meme", photos: "photo" } as const;

type FeedRow = { kind: string; id: number };

// One page of rate_feed rows of a single kind, newest first, plus one extra
// row to tell whether there is another page.
async function feedRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "meme" | "photo",
  page: number,
  size: number,
) {
  return supabase
    .from("rate_feed")
    .select("kind, id")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * size, page * size + size);
}

// The feed for /rate. The Memes and AI captions tabs are one kind, newest
// first. The All tab takes half a page of each and alternates them, so memes
// show up on the first page even when there are many newer photos. The
// rate_feed view (and RLS behind it) hides members-only memes from
// signed-out visitors; the rows themselves are loaded per kind.
export async function getRateFeed(page: number, tab: RateTab) {
  const supabase = await createClient();

  let pageRows: FeedRow[];
  let hasMore: boolean;
  if (tab === "all") {
    const half = FEED_PAGE_SIZE / 2;
    const [memeRows, photoRows] = await Promise.all([
      feedRows(supabase, "meme", page, half),
      feedRows(supabase, "photo", page, half),
    ]);
    const error = memeRows.error ?? photoRows.error;
    if (error) return { error, items: [] as FeedItem[], hasMore: false };

    const memesOnPage = (memeRows.data ?? []).slice(0, half);
    const photosOnPage = (photoRows.data ?? []).slice(0, half);
    pageRows = [];
    for (let i = 0; i < Math.max(memesOnPage.length, photosOnPage.length); i++) {
      if (memesOnPage[i]) pageRows.push(memesOnPage[i]);
      if (photosOnPage[i]) pageRows.push(photosOnPage[i]);
    }
    hasMore = (memeRows.data ?? []).length > half || (photoRows.data ?? []).length > half;
  } else {
    const { data, error } = await feedRows(supabase, TAB_KIND[tab], page, FEED_PAGE_SIZE);
    if (error) return { error, items: [] as FeedItem[], hasMore: false };
    pageRows = (data ?? []).slice(0, FEED_PAGE_SIZE);
    hasMore = (data ?? []).length > FEED_PAGE_SIZE;
  }

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
  return { error: null, items, hasMore };
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

// Memes this user posted in the last 24 hours (for the daily limit).
export async function countRecentMemes(userId: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("memes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count ?? 0;
}

// How many members-only memes exist; signed-out visitors can't read them,
// but they can see how many they're missing.
export async function getMembersOnlyMemeCount() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("members_only_meme_count");
  return typeof data === "number" ? data : Number(data ?? 0);
}

// Highest-scoring memes, newest first among ties, for the home page.
export async function getTopMemes(limit: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memes")
    .select(MEME_COLUMNS)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  return (data ?? []) as Meme[];
}
