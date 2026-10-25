import { RUBRIC, type DuelResult, type JudgedCaption, type RubricKey } from "@/lib/duel";

const BANNERS = {
  human: { emoji: "🎉", title: "You beat the bot!", tone: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40" },
  bot: { emoji: "🤖", title: "The bot wins this round", tone: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60" },
  tie: { emoji: "🤝", title: "Dead even", tone: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40" },
} as const;

function Side({ who, side, won }: { who: string; side: { text: string } & JudgedCaption; won: boolean }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        won ? "border-green-300 dark:border-green-800" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {who} {won && "· 👑"}
      </p>
      <p className="text-lg font-medium leading-snug">“{side.text}”</p>
      <dl className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
        {(Object.keys(RUBRIC) as RubricKey[]).map((key) => (
          <div key={key} className="contents">
            <dt className="text-zinc-500">{RUBRIC[key]}</dt>
            <dd className="flex gap-0.5" aria-label={`${side.scores[key]} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`h-2 w-4 rounded-full ${
                    n <= side.scores[key] ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {side.critique && <p className="text-sm text-zinc-600 dark:text-zinc-400">{side.critique}</p>}
    </div>
  );
}

// One judged try: who won and why, both lines with their scores, and the
// coaching on the user's own line.
export function DuelResultCard({ result, latest }: { result: DuelResult; latest: boolean }) {
  const banner = BANNERS[result.winner];
  return (
    <section className={`rounded-2xl border p-5 ${banner.tone}`} aria-label={`Try ${result.tryNo}`}>
      <p className="text-sm text-zinc-500">Try {result.tryNo}</p>
      <h2 className={`mt-1 font-semibold tracking-tight ${latest ? "text-2xl" : "text-lg"}`}>
        <span aria-hidden>{banner.emoji}</span> {banner.title}
      </h2>
      {result.reason && <p className="mt-2 text-zinc-700 dark:text-zinc-300">{result.reason}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Side who={`You (${result.humanLabel})`} side={result.human} won={result.winner === "human"} />
        <Side
          who={`Gemini (${result.humanLabel === "A" ? "B" : "A"})`}
          side={result.bot}
          won={result.winner === "bot"}
        />
      </div>

      {(result.human.craft_note || result.human.punch_up) && (
        <div className="mt-4 rounded-xl bg-white/70 p-4 text-sm dark:bg-black/20">
          <p className="font-medium">🎤 The judge&apos;s note on your line</p>
          {result.human.craft_note && <p className="mt-1">{result.human.craft_note}</p>}
          {result.human.punch_up && (
            <p className="mt-2">
              <span className="text-zinc-500">Punched up: </span>“{result.human.punch_up}”
            </p>
          )}
        </div>
      )}
    </section>
  );
}
