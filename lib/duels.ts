import "server-only";
import type { Caption, VoteValue } from "@/lib/captions";
import { pickDailyId, type DuelResult, type DuelWinner, type JudgedCaption, type Verdict } from "@/lib/duel";
import { createClient } from "@/lib/supabase/server";
import { newYorkDayNumber } from "@/lib/time";

// Read helpers for Beat the Bot. They use the auth-aware client, so RLS only
// returns the signed-in user's own tries.

// Today's photo to beat, the same for everyone. It is picked only from photos
// posted before today (New York time), so a photo posted or deleted during the
// day can't swap it out from under people who already played.
export async function getDailyDuelId() {
  const supabase = await createClient();
  const today = newYorkDayNumber();
  const { data } = await supabase
    .from("generations")
    .select("id, created_at, captions!inner(id)")
    .order("id", { ascending: true })
    .limit(1000);
  const rows = data ?? [];
  const settled = rows.filter((row) => newYorkDayNumber(new Date(row.created_at as string)) < today);
  // On the very first day nothing is older yet: use the oldest photo.
  if (settled.length === 0) return (rows[0]?.id as number | undefined) ?? null;
  return pickDailyId(settled.map((row) => row.id as number), today);
}

// The bot's entry: the photo's top-scoring caption, the earliest one on a tie.
// The player's own votes are left out, so they can't pick their opponent by
// voting before they play.
export function botCaption(captions: Caption[], myVotes: Map<number, VoteValue> = new Map()) {
  const score = (caption: Caption) => caption.score - (myVotes.get(caption.id) ?? 0);
  return [...captions].sort((a, b) => score(b) - score(a) || a.position - b.position)[0] ?? null;
}

type DuelRow = {
  try_no: number;
  human_text: string;
  bot_caption_id: number | null;
  bot_text: string;
  human_label: "A" | "B";
  winner: DuelWinner;
  verdict: Verdict;
  created_at: string;
};

export const DUEL_COLUMNS =
  "try_no, human_text, bot_caption_id, bot_text, human_label, winner, verdict, created_at";

// A stored try, mapped from the judge's A/B to you/Gemini.
export function toDuelResult(row: DuelRow): DuelResult {
  const humanLabel = row.human_label;
  const botLabel = humanLabel === "A" ? "B" : "A";
  const side = (label: "A" | "B"): JudgedCaption => row.verdict[label];
  // A line that tried to instruct the judge loses no matter what the model
  // picked (submitDuel); say so instead of showing a reason that disagrees.
  const reason = row.verdict[humanLabel].flags?.injection
    ? "Your line read as instructions to the judge rather than a caption, so it can't win."
    : row.verdict.reason;
  return {
    tryNo: row.try_no,
    winner: row.winner,
    humanLabel,
    botCaptionId: row.bot_caption_id,
    human: { text: row.human_text, ...side(humanLabel) },
    bot: { text: row.bot_text, ...side(botLabel) },
    reason,
    createdAt: row.created_at,
  };
}

// This user's tries on this photo, first try first.
export async function getMyDuels(userId: string | undefined, generationId: number) {
  if (!userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("duels")
    .select(DUEL_COLUMNS)
    .eq("user_id", userId)
    .eq("generation_id", generationId)
    .order("try_no", { ascending: true });
  return ((data ?? []) as DuelRow[]).map(toDuelResult);
}
