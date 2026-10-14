// Shown while /rate loads (e.g. coming from another page), so the click gets
// an immediate response instead of a frozen screen.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 font-sans sm:py-12" aria-busy>
      <span className="sr-only">Loading the feed…</span>
      <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-6 flex gap-2">
        {[16, 28, 24, 28].map((width, index) => (
          <div
            key={index}
            className="h-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
            style={{ width: `${width / 4}rem` }}
          />
        ))}
      </div>
      {[0, 1].map((card) => (
        <div
          key={card}
          className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-surface dark:border-zinc-800"
        >
          <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </main>
  );
}
