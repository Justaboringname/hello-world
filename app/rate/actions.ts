"use server";

import type { VoteValue } from "@/lib/captions";
import { createClient } from "@/lib/supabase/server";

export type VoteResult =
  | { ok: true; upvotes: number; downvotes: number; myVote: VoteValue | null }
  | { ok: false; message: string };

// Cast, change (vote = the other value) or take back (vote = null) the
// signed-in user's vote on one caption. One row per (caption, user) in
// caption_votes; a trigger keeps the caption's totals in sync.
export async function castVote(
  captionId: number,
  vote: VoteValue | null,
): Promise<VoteResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false, message: "Sign in to vote." };
  const userId = data.claims.sub;

  if (!Number.isSafeInteger(captionId) || captionId <= 0) {
    return { ok: false, message: "Unknown caption." };
  }
  if (vote !== null && vote !== 1 && vote !== -1) {
    return { ok: false, message: "Invalid vote." };
  }

  const { error } =
    vote === null
      ? await supabase
          .from("caption_votes")
          .delete()
          .eq("caption_id", captionId)
          .eq("user_id", userId)
      : await supabase.from("caption_votes").upsert(
          {
            caption_id: captionId,
            user_id: userId,
            vote,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "caption_id,user_id" },
        );
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "That caption no longer exists."
          : "Couldn't save your vote. Try again.",
    };
  }

  const { data: caption } = await supabase
    .from("captions")
    .select("upvotes, downvotes")
    .eq("id", captionId)
    .single();
  if (!caption) return { ok: false, message: "That caption no longer exists." };

  return { ok: true, upvotes: caption.upvotes, downvotes: caption.downvotes, myVote: vote };
}
