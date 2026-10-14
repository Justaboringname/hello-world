import Link from "next/link";

// Missing photos, memes and pages. Points back to the two places people go.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center font-sans">
      <p className="text-5xl" aria-hidden>
        🫥
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Nothing here</h1>
      <p className="text-zinc-500">
        This page doesn&apos;t exist, or the post was removed.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link
          href="/rate"
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Go rate something
        </Link>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 bg-surface px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
