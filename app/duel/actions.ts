"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PHOTO_TYPES } from "@/lib/captions";
import {
  DAILY_DUEL_LIMIT,
  DUEL_MAX_LENGTH,
  TRIES_PER_PHOTO,
  isDuelOver,
  isNearCopy,
  type DuelWinner,
} from "@/lib/duel";
import { botCaption, getMyDuels } from "@/lib/duels";
import { getGeneration, getMyVotes, photoUrl } from "@/lib/feed";
import { JUDGE_SYSTEM_PROMPT, JudgeError, judgeDuel } from "@/lib/judge";
import type { FormState } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RESERVE_ERRORS: Record<string, string> = {
  daily_limit: `You've had ${DAILY_DUEL_LIMIT} tries in the last 24 hours. The bot needs a nap; come back tomorrow!`,
  duel_over: "You're done with this photo. Try today's photo instead!",
  in_progress: "The judge is still reading your last try. Give it a moment, then reload.",
};

// One try at beating the bot: check the rules, reserve the try in the
// database (so the limits count judge calls, even parallel ones), have the
// judge compare the line with the bot's caption in random A/B order, then save
// the verdict with the service-role client. A try the judge never answered is
// marked failed, so it doesn't use up one of the user's tries.
export async function submitDuel(_prev: FormState, formData: FormData): Promise<FormState> {
  const generationId = Number(formData.get("generation_id"));
  if (!Number.isSafeInteger(generationId) || generationId <= 0) {
    return { status: "error", message: "That photo doesn't exist." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(`/login?next=${encodeURIComponent(`/duel?photo=${generationId}`)}`);
  const userId = data.claims.sub;

  // Control characters (NUL included, which Postgres can't store) become
  // spaces, like any other run of whitespace.
  const text = String(formData.get("caption") ?? "")
    .replace(/[\s\p{Cc}]+/gu, " ")
    .trim();
  if (!text) return { status: "error", message: "Write a caption first." };
  if (text.length > DUEL_MAX_LENGTH) {
    return { status: "error", message: `Keep it to one line under ${DUEL_MAX_LENGTH} characters.` };
  }

  const generation = await getGeneration(generationId);
  if (!generation) return { status: "error", message: "That photo doesn't exist." };

  const tries = await getMyDuels(userId, generationId);
  if (isDuelOver(tries)) return { status: "error", message: RESERVE_ERRORS.duel_over };

  // The bot keeps the caption it played on try 1; on the first try it's the
  // top caption with this user's own votes left out.
  const pinnedId = tries[0]?.botCaptionId;
  const pinned = pinnedId ? generation.captions.find((caption) => caption.id === pinnedId) : undefined;
  const bot =
    pinned ??
    botCaption(
      generation.captions,
      await getMyVotes(userId, generation.captions.map((caption) => caption.id)),
    );
  if (!bot) return { status: "error", message: "This photo has no AI caption to beat yet." };

  if (isNearCopy(text, generation.captions.map((caption) => caption.text))) {
    return {
      status: "error",
      message: "That's (almost) one of the bot's own captions for this photo. Write your own!",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { status: "error", message: "Beat the bot isn't set up yet (missing SUPABASE_SERVICE_ROLE_KEY)." };
  }

  // Reserve before spending a Gemini call. The function locks per user, so
  // two tabs can't both pass the checks.
  const { data: reserved, error: reserveError } = await admin
    .rpc("reserve_duel_attempt", {
      p_user: userId,
      p_generation: generationId,
      p_daily_limit: DAILY_DUEL_LIMIT,
      p_tries: TRIES_PER_PHOTO,
    })
    .single<{ attempt_id: number; try_no: number }>();
  if (reserveError || !reserved) {
    const known = Object.keys(RESERVE_ERRORS).find((key) => reserveError?.message?.includes(key));
    if (!known) console.error("Could not reserve a duel try", reserveError);
    return {
      status: "error",
      message: known ? RESERVE_ERRORS[known] : "Couldn't start the duel. Please try again.",
    };
  }
  const failAttempt = async (message: string): Promise<FormState> => {
    await admin.from("duel_attempts").update({ status: "failed" }).eq("id", reserved.attempt_id);
    return { status: "error", message };
  };

  let image: Buffer;
  let mimeType: string;
  try {
    const photo = await fetch(photoUrl(generation.image_path), {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    mimeType = photo.headers.get("content-type")?.split(";")[0] ?? "";
    if (!photo.ok || !PHOTO_TYPES.includes(mimeType)) {
      return failAttempt("Couldn't load the photo for the judge. Please try again.");
    }
    image = Buffer.from(await photo.arrayBuffer());
  } catch {
    return failAttempt("Couldn't load the photo for the judge. Please try again.");
  }

  // Which slot the human's line gets is random, so the judge can't learn
  // "the human is always A", and position bias doesn't always favor one side.
  const humanLabel = Math.random() < 0.5 ? "A" : "B";
  const [a, b] = humanLabel === "A" ? [text, bot.text] : [bot.text, text];

  let judged;
  try {
    judged = await judgeDuel({ image, mimeType, a, b });
  } catch (error) {
    if (error instanceof JudgeError) return failAttempt(error.message);
    await failAttempt("");
    throw error;
  }

  const { verdict } = judged;
  // A human line that tried to instruct the judge always loses. The bot's line
  // is one of our own stored captions, so a flag on it is a misfire and never
  // hands the human a win.
  const winner: DuelWinner = verdict[humanLabel].flags.injection
    ? "bot"
    : verdict.winner === "tie"
      ? "tie"
      : verdict.winner === humanLabel
        ? "human"
        : "bot";

  const { error } = await admin.from("duels").insert({
    generation_id: generationId,
    user_id: userId,
    try_no: reserved.try_no,
    human_text: text,
    bot_caption_id: bot.id,
    bot_text: bot.text,
    human_label: humanLabel,
    winner,
    verdict,
    judge_model: judged.model,
    judge_prompt: `${JUDGE_SYSTEM_PROMPT}\n\n${judged.prompt}`,
  });
  if (error) {
    console.error("Could not save duel", error);
    // The judge call was spent, so the attempt keeps counting toward the
    // daily limit; only the try slot is freed.
    return failAttempt("The judge decided, but saving failed. Please try again.");
  }
  await admin.from("duel_attempts").update({ status: "done" }).eq("id", reserved.attempt_id);

  revalidatePath("/duel");
  return {
    status: "success",
    message: reserved.try_no >= TRIES_PER_PHOTO || winner === "human" ? "done" : "again",
  };
}
