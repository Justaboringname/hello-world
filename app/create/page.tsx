import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateForm } from "@/components/create-form";
import { MemeForm } from "@/components/meme-form";
import { Page, PageHeader } from "@/components/page";
import { requireViewer } from "@/lib/auth";
import { DAILY_GENERATION_LIMIT, DAILY_MEME_LIMIT } from "@/lib/captions";
import { countRecentGenerations, countRecentMemes } from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";
import { firstParam } from "@/lib/redirect";

export const metadata = { title: "Create · Hello World" };

// The caption calls (Claude, then Gemini if needed) run inside this page's
// Server Action; give them room.
export const maxDuration = 60;

const MODES = {
  captions: { label: "AI captions", path: "/create" },
  meme: { label: "Make a meme", path: "/create?mode=meme" },
} as const;

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const mode = firstParam((await searchParams).mode) === "meme" ? "meme" : "captions";
  const viewer = await requireViewer(MODES[mode].path);
  // Posts show "First L.", so make sure there is a name first.
  if (!isProfileComplete(viewer.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(MODES[mode].path)}`);
  }

  const postedAs = (
    <strong className="font-bold text-ink">
      {viewer.profile!.first_name} {viewer.profile!.last_name![0]}.
    </strong>
  );

  return (
    <Page>
      <PageHeader glyph="C" color="blue" title="Create">
        {mode === "captions" ? (
          <>
            Upload something you saw around the city. The AI writes three captions in
            the vibe you pick, then everyone votes on the funniest one. Your photo and
            captions are public, posted as {postedAs}
          </>
        ) : (
          <>
            Post your own meme to the feed for everyone to rate. It&apos;s public, posted
            as {postedAs}
          </>
        )}
      </PageHeader>

      <nav className="mt-7 inline-flex gap-1 rounded-2xl border border-rule bg-surface p-1" aria-label="What to create">
        {(Object.keys(MODES) as (keyof typeof MODES)[]).map((key) => (
          <Link
            key={key}
            href={MODES[key].path}
            aria-current={mode === key ? "page" : undefined}
            className={`rounded-xl px-4 py-2 font-semibold transition-colors ${
              mode === key ? "bg-ink text-canvas" : "text-muted hover:text-ink"
            }`}
          >
            {MODES[key].label}
          </Link>
        ))}
      </nav>

      <div className="mt-7">
        {mode === "captions" ? (
          <CreateForm
            remaining={DAILY_GENERATION_LIMIT - (await countRecentGenerations(viewer.userId))}
          />
        ) : (
          <MemeForm remaining={DAILY_MEME_LIMIT - (await countRecentMemes(viewer.userId))} />
        )}
      </div>
    </Page>
  );
}
