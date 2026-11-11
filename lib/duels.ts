import "server-only";
import type { Caption, VoteValue } from "@/lib/captions";
import { TRIES_PER_PHOTO, pickDailyId, type DuelResult, type DuelWinner, type JudgedCaption, type Verdict } from "@/lib/duel";
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

export type UnfinishedDuel = {
  generationId: number;
  triesLeft: number;
  lastTriedAt: string;
  imagePath: string | null;
  location: string | null;
};

// Photos this user started dueling and hasn't finished: at least one try, no
// win yet, and tries left. Newest first, so the duel they just left is on top.
// RLS keeps this to their own tries.
export async function getMyUnfinishedDuels(userId: string | undefined, exceptId?: number) {
  if (!userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("duels")
    .select("generation_id, winner, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  const byPhoto = new Map<number, { tries: number; won: boolean; lastTriedAt: string }>();
  for (const row of data ?? []) {
    const id = row.generation_id as number;
    const entry = byPhoto.get(id) ?? { tries: 0, won: false, lastTriedAt: row.created_at as string };
    entry.tries += 1;
    if (row.winner === "human") entry.won = true;
    byPhoto.set(id, entry);
  }

  const open = [...byPhoto.entries()].filter(
    ([id, entry]) => id !== exceptId && !entry.won && entry.tries < TRIES_PER_PHOTO,
  );
  if (open.length === 0) return [];

  const { data: photos } = await supabase
    .from("generations")
    .select("id, image_path, location")
    .in(
      "id",
      open.map(([id]) => id),
    );
  const photoById = new Map((photos ?? []).map((photo) => [photo.id as number, photo]));

  return open
    .filter(([id]) => photoById.has(id)) // a deleted photo can't be dueled any more
    .map(([id, entry]): UnfinishedDuel => {
      const photo = photoById.get(id)!;
      return {
        generationId: id,
        triesLeft: TRIES_PER_PHOTO - entry.tries,
        lastTriedAt: entry.lastTriedAt,
        imagePath: (photo.image_path as string | null) ?? null,
        location: (photo.location as string | null) ?? null,
      };
    });
}
