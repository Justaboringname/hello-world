import Link from "next/link";
import type { UnfinishedDuel } from "@/lib/duels";
import { photoUrl } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

// "Pick up where you left off": every photo the user started dueling and
// hasn't finished, newest first, each linking straight back to its duel with
// the earlier tries and the tries left.
export function UnfinishedDuels({
  duels,
  title = "Unfinished duels",
}: {
  duels: UnfinishedDuel[];
  title?: string;
}) {
  if (duels.length === 0) return null;
  return (
    <section aria-labelledby="unfinished-duels" className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <h2 id="unfinished-duels" className="font-semibold">
        {title} <span className="font-normal text-zinc-500">({duels.length})</span>
      </h2>
      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
        Pick up where you left off. Your earlier tries and the judge&apos;s notes are saved.
      </p>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {duels.map((duel) => (
          <li key={duel.generationId} className="shrink-0">
            <Link
              href={`/duel?photo=${duel.generationId}`}
              className="flex w-40 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800"
            >
              {duel.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl(duel.imagePath)}
                  alt={duel.location ? `Photo from ${duel.location}` : "Photo you started dueling"}
                  className="h-24 w-full bg-zinc-900 object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center bg-zinc-100 text-2xl dark:bg-zinc-800">🤖</div>
              )}
              <span className="px-3 pt-2 text-sm font-medium text-blue-600">
                {duel.triesLeft} {duel.triesLeft === 1 ? "try" : "tries"} left &rarr;
              </span>
              <span className="truncate px-3 pb-2 text-xs text-zinc-500">
                {duel.location ? `📍 ${duel.location} · ` : ""}
                {timeAgo(duel.lastTriedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
