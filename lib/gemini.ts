import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { VIBES, type Vibe } from "@/lib/captions";

// Gemini 2.5 Flash shuts down in October 2026; override with GEMINI_MODEL if
// your key needs a different model.
const DEFAULT_MODEL = "gemini-3.5-flash";
const CAPTION_COUNT = 3;
const CAPTION_MAX_LENGTH = 200;

const SYSTEM_PROMPT = `You write photo captions for a website where college students who are new to New York City post photos from around the city, and everyone votes on the funniest caption.

Rules:
- Write exactly ${CAPTION_COUNT} captions. Each one takes a different angle on what is actually in the photo.
- One line each, under 100 characters. No hashtags, no surrounding quotation marks, at most one emoji.
- Be specific to this photo. Generic captions that could fit any picture lose.
- Be funny and kind: punch up. Never joke about anyone's appearance, race, ethnicity, religion, gender, sexuality or disability.
- If the photo isn't from New York, caption it anyway in the requested voice.`;

export class CaptionError extends Error {}

export type CaptionResult = {
  captions: string[];
  systemPrompt: string;
  prompt: string;
  model: string;
};

function buildPrompt(vibe: Vibe, location: string | null) {
  const where = location
    ? `The poster says it was taken at: "${location}".`
    : "The poster didn't say where in New York it was taken.";
  return `Voice: write as ${VIBES[vibe].instruction}\n${where}\nCaption this photo.`;
}

// Returns the captions plus the exact prompt text and model used, so they can
// be saved alongside the photo.
export async function generateCaptions({
  image,
  mimeType,
  vibe,
  location,
}: {
  image: Buffer;
  mimeType: string;
  vibe: Vibe;
  location: string | null;
}): Promise<CaptionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new CaptionError("Caption generation isn't set up yet (missing GEMINI_API_KEY).");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = buildPrompt(vibe, location);
  const ai = new GoogleGenAI({ apiKey });

  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { inlineData: { data: image.toString("base64"), mimeType } },
        prompt,
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            captions: {
              type: "array",
              items: { type: "string" },
              minItems: CAPTION_COUNT,
              maxItems: CAPTION_COUNT,
            },
          },
          required: ["captions"],
        },
        // Short captions don't need long reasoning, and users are waiting.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    text = response.text;
  } catch (error) {
    console.error("Gemini request failed", error);
    if (error instanceof ApiError && error.status === 429) {
      throw new CaptionError("Gemini is busy right now. Try again in a minute.");
    }
    throw new CaptionError("Gemini couldn't caption that photo. Please try again.");
  }

  const captions = parseCaptions(text);
  if (captions.length === 0) {
    throw new CaptionError(
      "Gemini didn't return any captions for that photo. Try a different one.",
    );
  }
  return { captions, systemPrompt: SYSTEM_PROMPT, prompt, model };
}

function parseCaptions(text: string | undefined) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text ?? "");
  } catch {
    return [];
  }

  const list = (parsed as { captions?: unknown })?.captions;
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const captions: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const caption = item
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^["“](.*)["”]$/, "$1")
      .slice(0, CAPTION_MAX_LENGTH)
      .trim();
    const key = caption.toLowerCase();
    if (!caption || seen.has(key)) continue;
    seen.add(key);
    captions.push(caption);
  }
  return captions.slice(0, CAPTION_COUNT);
}
