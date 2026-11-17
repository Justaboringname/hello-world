import Link from "next/link";
import { Bullet } from "@/components/bullet";
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
    <section aria-labelledby="unfinished-duels" className="rounded-2xl border border-rule bg-raised p-4 sm:p-5">
      <h2 id="unfinished-duels" className="flex items-center gap-2 text-[1.05rem] font-bold">
        {title}
        <Bullet color="orange" className="text-[0.85rem]" label={`${duels.length}`}>
          {duels.length}
        </Bullet>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Pick up where you left off. Your earlier tries and the judge&apos;s notes are saved.
      </p>
      <ul className="mt-3.5 flex gap-3 overflow-x-auto pb-1">
        {duels.map((duel) => (
          <li key={duel.generationId} className="shrink-0">
            <Link
              href={`/duel?photo=${duel.generationId}`}
              className="flex w-44 flex-col overflow-hidden rounded-xl border border-rule bg-surface transition-colors hover:border-ink"
            >
              {duel.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl(duel.imagePath)}
                  alt={duel.location ? `Photo from ${duel.location}` : "Photo you started dueling"}
                  className="h-28 w-full bg-black object-cover"
                />
              ) : (
                <div className="h-28 bg-black" />
              )}
              <span className="px-3 pt-2.5 text-sm font-bold">
                {duel.triesLeft} {duel.triesLeft === 1 ? "try" : "tries"} left
              </span>
              <span className="truncate px-3 pb-2.5 text-xs text-muted">
                {duel.location ? `${duel.location}, ` : ""}
                {timeAgo(duel.lastTriedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
