// Shown while /rate loads (e.g. coming from another page), so the click gets
// an immediate response instead of a frozen screen.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12" aria-busy>
      <span className="sr-only">Loading the feed…</span>
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,40rem)] lg:justify-center lg:gap-14">
        <div>
          <div className="shimmer h-14 w-40 rounded-xl" />
          <div className="shimmer mt-4 h-5 w-64 max-w-full rounded" />
          <div className="mt-6 flex gap-2 lg:flex-col">
            {[5, 8, 6, 8].map((width, index) => (
              <div key={index} className="shimmer h-10 rounded-xl" style={{ width: `${width}rem` }} />
            ))}
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-7 lg:mt-1">
          {[0, 1].map((card) => (
            <div key={card} className="overflow-hidden rounded-2xl border border-rule bg-surface">
              <div className="shimmer aspect-[4/3]" />
              <div className="space-y-3 p-5">
                <div className="shimmer h-4 w-2/3 rounded" />
                <div className="shimmer h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
