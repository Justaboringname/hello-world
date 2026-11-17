import type { CSSProperties } from "react";
import { Confetti } from "@/components/confetti";
import { Crown } from "@/components/icons";
import { RUBRIC, type DuelResult, type JudgedCaption, type RubricKey } from "@/lib/duel";

const BANNERS = {
  human: { title: "You beat the bot", tone: "bg-yellow text-black" },
  bot: { title: "The bot wins this round", tone: "bg-purple text-white" },
  tie: { title: "Dead even", tone: "bg-ink text-canvas" },
} as const;

// One side's line as the judge read it, with what the judge said about it.
function Line({
  who,
  label,
  dot,
  side,
  won,
}: {
  who: string;
  label: "A" | "B";
  dot: string;
  side: { text: string } & JudgedCaption;
  won: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2.5 rounded-xl border-[1.5px] p-4 ${won ? "border-ink" : "border-rule"}`}>
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        {who}
        <span className="font-normal text-muted">read as {label}</span>
        {won && (
          <span
            className="bullet ml-auto text-[0.95rem]"
            style={{ "--b": "var(--yellow)", "--bt": "#000" } as CSSProperties}
            title="Winner"
          >
            <Crown className="h-[0.95em] w-[0.95em]" />
          </span>
        )}
      </p>
      <p className="joke text-[1.25rem]">&ldquo;{side.text}&rdquo;</p>
      {side.critique && <p className="text-sm text-muted">{side.critique}</p>}
    </div>
  );
}

// A score out of 5 as a bar that grows away from the middle column.
function Bar({ value, fill, from, delay }: { value: number; fill: string; from: "left" | "right"; delay: number }) {
  return (
    <span className={`flex h-2.5 flex-1 overflow-hidden rounded-full bg-rule/60 ${from === "right" ? "justify-end" : ""}`}>
      <span
        className={`grow-x h-full rounded-full ${fill}`}
        style={{ width: `${(value / 5) * 100}%`, "--origin": from, "--d": `${delay}ms` } as CSSProperties}
      />
    </span>
  );
}

// The tale of the tape: both lines' scores on each thing the judge looks at,
// facing each other across the middle.
function Tape({ result, animate }: { result: DuelResult; animate: boolean }) {
  return (
    <div className="mt-5">
      <p className="flex justify-between text-sm font-bold">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange" />
          You
        </span>
        <span className="flex items-center gap-2">
          The bot
          <span className="h-2.5 w-2.5 rounded-full bg-purple" />
        </span>
      </p>
      <ul className="mt-2 grid gap-2">
        {(Object.keys(RUBRIC) as RubricKey[]).map((key, index) => {
          const human = result.human.scores[key];
          const bot = result.bot.scores[key];
          const delay = animate ? 250 + index * 90 : 0;
          return (
            <li
              key={key}
              aria-label={`${RUBRIC[key]}: you ${human} out of 5, the bot ${bot} out of 5`}
              className="grid grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-center gap-2.5 sm:grid-cols-[minmax(0,1fr)_10.5rem_minmax(0,1fr)]"
            >
              <span className="flex items-center gap-2" aria-hidden>
                <Bar value={human} fill="bg-orange" from="right" delay={delay} />
                <span className={`w-3 text-right font-bold tabular-nums ${human > bot ? "text-you" : "text-muted"}`}>
                  {human}
                </span>
              </span>
              <span className="text-center text-xs leading-tight text-muted sm:text-sm" aria-hidden>
                {RUBRIC[key]}
              </span>
              <span className="flex items-center gap-2" aria-hidden>
                <span className={`w-3 font-bold tabular-nums ${bot > human ? "text-bot" : "text-muted"}`}>{bot}</span>
                <Bar value={bot} fill="bg-purple" from="left" delay={delay} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// One judged try: who won and why, both lines, their scores side by side, and
// the coaching on the user's own line.
export function DuelResultCard({ result, latest }: { result: DuelResult; latest: boolean }) {
  const banner = BANNERS[result.winner];
  const botLabel = result.humanLabel === "A" ? "B" : "A";
  return (
    <section className="overflow-hidden rounded-2xl border border-rule bg-surface" aria-label={`Try ${result.tryNo}`}>
      <div className={`relative overflow-hidden px-5 py-4 ${banner.tone}`}>
        {latest && result.winner === "human" && <Confetti />}
        <p className="relative text-sm font-semibold opacity-80">Try {result.tryNo}</p>
        <h2 className={`display relative mt-0.5 ${latest ? "text-[2.5rem] sm:text-[3rem]" : "text-[1.7rem]"}`}>
          {banner.title}
        </h2>
      </div>

      <div className="p-5">
        {result.reason && <p className="text-[1.05rem] leading-relaxed">{result.reason}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Line
            who="You"
            label={result.humanLabel}
            dot="bg-orange"
            side={result.human}
            won={result.winner === "human"}
          />
          <Line who="The bot" label={botLabel} dot="bg-purple" side={result.bot} won={result.winner === "bot"} />
        </div>

        <Tape result={result} animate={latest} />

        {(result.human.craft_note || result.human.punch_up) && (
          <div className="mt-5 rounded-xl bg-raised p-4">
            <p className="font-bold">The judge&apos;s note on your line</p>
            {result.human.craft_note && <p className="mt-1.5 text-[0.95rem]">{result.human.craft_note}</p>}
            {result.human.punch_up && (
              <p className="mt-3">
                <span className="block text-sm text-muted">Your line, punched up</span>
                <span className="joke mt-0.5 block text-[1.2rem]">&ldquo;{result.human.punch_up}&rdquo;</span>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
