"use server";

import type { VoteValue } from "@/lib/captions";
import { createClient } from "@/lib/supabase/server";

export type VoteTarget = "caption" | "meme";

export type VoteResult =
  | { ok: true; upvotes: number; downvotes: number; myVote: VoteValue | null }
  | { ok: false; message: string };

// Where each kind of vote lives. A trigger on each votes table keeps the
// item's upvotes/downvotes in sync.
const TABLES = {
  caption: { votes: "caption_votes", items: "captions", key: "caption_id" },
  meme: { votes: "meme_votes", items: "memes", key: "meme_id" },
} as const;

// Cast, change (vote = the other value) or take back (vote = null) the
// signed-in user's vote on one caption or meme. One row per (item, user).
export async function castVote(
  target: VoteTarget,
  id: number,
  vote: VoteValue | null,
): Promise<VoteResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false, message: "Sign in to vote." };
  const userId = data.claims.sub;

  if (!Object.hasOwn(TABLES, target)) return { ok: false, message: "Unknown item." };
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, message: "Unknown item." };
  if (vote !== null && vote !== 1 && vote !== -1) {
    return { ok: false, message: "Invalid vote." };
  }
  const table = TABLES[target];

  const { error } =
    vote === null
      ? await supabase.from(table.votes).delete().eq(table.key, id).eq("user_id", userId)
      : await supabase.from(table.votes).upsert(
          {
            [table.key]: id,
            user_id: userId,
            vote,
            updated_at: new Date().toISOString(),
          },
          { onConflict: `${table.key},user_id` },
        );
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "That no longer exists."
          : "Couldn't save your vote. Try again.",
    };
  }

  const { data: item } = await supabase
    .from(table.items)
    .select("upvotes, downvotes")
    .eq("id", id)
    .single();
  if (!item) return { ok: false, message: "That no longer exists." };

  return { ok: true, upvotes: item.upvotes, downvotes: item.downvotes, myVote: vote };
}
