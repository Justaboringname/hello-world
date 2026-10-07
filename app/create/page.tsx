import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateForm } from "@/components/create-form";
import { MemeForm } from "@/components/meme-form";
import { requireViewer } from "@/lib/auth";
import { DAILY_GENERATION_LIMIT, DAILY_MEME_LIMIT } from "@/lib/captions";
import { countRecentGenerations, countRecentMemes } from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Create · Hello World" };

// The Gemini call runs inside this page's Server Action; give it room.
export const maxDuration = 60;

const MODES = {
  captions: { label: "✨ AI captions", path: "/create" },
  meme: { label: "😂 Make a meme", path: "/create?mode=meme" },
} as const;

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const mode = firstParam((await searchParams).mode) === "meme" ? "meme" : "captions";
  const viewer = await requireViewer(MODES[mode].path);
  // Posts show "First L.", so make sure there is a name first.
  if (!isProfileComplete(viewer.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(MODES[mode].path)}`);
  }

  const postedAs = `${viewer.profile!.first_name} ${viewer.profile!.last_name![0]}.`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">Create</h1>

      <nav className="mt-6 flex gap-2" aria-label="What to create">
        {(Object.keys(MODES) as (keyof typeof MODES)[]).map((key) => (
          <Link
            key={key}
            href={MODES[key].path}
            aria-current={mode === key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {MODES[key].label}
          </Link>
        ))}
      </nav>

      {mode === "captions" ? (
        <>
          <p className="mt-6 text-zinc-500">
            Upload something you saw around the city. Gemini writes three captions
            in the vibe you pick, then everyone votes on the funniest one. Your
            photo and captions are public, posted as{" "}
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">{postedAs}</strong>
          </p>
          <div className="mt-8">
            <CreateForm
              remaining={DAILY_GENERATION_LIMIT - (await countRecentGenerations(viewer.userId))}
            />
          </div>
        </>
      ) : (
        <>
          <p className="mt-6 text-zinc-500">
            Post your own meme to the feed for everyone to rate. It&apos;s public,
            posted as{" "}
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">{postedAs}</strong>
          </p>
          <div className="mt-8">
            <MemeForm remaining={DAILY_MEME_LIMIT - (await countRecentMemes(viewer.userId))} />
          </div>
        </>
      )}
    </main>
  );
}
