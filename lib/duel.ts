// Beat the Bot: shared by the browser and the server, no secrets in here.

export const DUEL_MAX_LENGTH = 100; // the same one-line rule Gemini's captions follow
export const TRIES_PER_PHOTO = 3;
// Each try is one Gemini call on the shared free tier, like /create's limit.
export const DAILY_DUEL_LIMIT = 20;

export const RUBRIC = {
  specific: "Specific to this photo",
  surprise: "Surprise",
  economy: "Tight wording",
  voice: "Sounds like a real person",
  kind: "Punches up",
} as const;
export type RubricKey = keyof typeof RUBRIC;

export type JudgedCaption = {
  scores: Record<RubricKey, number>;
  critique: string;
  craft_note: string;
  punch_up: string;
  flags: { injection: boolean; unkind: boolean };
};

// What the judge returns. It only ever sees "A" and "B"; which one the human
// wrote is stored next to it in duels.human_label.
export type Verdict = {
  A: JudgedCaption;
  B: JudgedCaption;
  winner: "A" | "B" | "tie";
  reason: string;
};

export type DuelWinner = "human" | "bot" | "tie";

// One try as the duel page shows it, already mapped from A/B to you/Gemini.
// humanLabel is kept so the judge's reason ("A is more specific...") can be
// matched to a column.
export type DuelResult = {
  tryNo: number;
  winner: DuelWinner;
  humanLabel: "A" | "B";
  botCaptionId: number | null;
  human: { text: string } & JudgedCaption;
  bot: { text: string } & JudgedCaption;
  reason: string;
  createdAt: string;
};

export function isDuelOver(results: Pick<DuelResult, "winner">[]) {
  return results.length >= TRIES_PER_PHOTO || results.some((r) => r.winner === "human");
}

// Lowercase words only, for comparing a try with Gemini's own captions.
function words(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
}

// True when a try is (nearly) one of the photo's existing captions: copying
// Gemini's line from the photo page shouldn't count as beating it.
export function isNearCopy(text: string, captions: string[]) {
  const mine = new Set(words(text));
  if (mine.size === 0) return false;
  return captions.some((caption) => {
    const theirs = new Set(words(caption));
    const shared = [...mine].filter((word) => theirs.has(word)).length;
    const union = new Set([...mine, ...theirs]).size;
    return union > 0 && shared / union >= 0.8;
  });
}

// The photo everyone duels today: the same for everyone, a new one each New
// York day, cycling through every photo in order.
export function pickDailyId(ids: number[], nyDayNumber: number) {
  if (ids.length === 0) return null;
  const sorted = [...ids].sort((a, b) => a - b);
  return sorted[((nyDayNumber % sorted.length) + sorted.length) % sorted.length];
}
