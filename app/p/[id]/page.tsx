import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/copy-link-button";
import { GenerationCard } from "@/components/generation-card";
import { PostedBanner } from "@/components/posted-banner";
import { getViewer } from "@/lib/auth";
import { vibeLabel } from "@/lib/captions";
import { getGeneration, getMyVotes, photoUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

function parseId(value: string) {
  return /^\d{1,15}$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const generation = id ? await getGeneration(id) : null;
  if (!generation) return { title: "Not found · Hello World" };

  const best = [...generation.captions].sort((a, b) => b.score - a.score)[0];
  const title = best ? `“${best.text}”` : "AI captions";
  return {
    title: `${title} · Hello World`,
    description: "Vote on the funniest AI caption for this photo.",
    openGraph: { title, images: [photoUrl(generation.image_path)] },
  };
}

// One photo with its captions: the link people share, and where you land
// after posting one.
export default async function GenerationPage({ params, searchParams }: PageProps<"/p/[id]">) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const posted = firstParam((await searchParams).posted) === "1";

  const [viewer, generation] = await Promise.all([getViewer(), getGeneration(id)]);
  if (!generation) notFound();

  const votes = await getMyVotes(
    viewer?.userId,
    generation.captions.map((caption) => caption.id),
  );
  const loginHref = `/login?next=${encodeURIComponent(`/p/${id}`)}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 font-sans sm:py-12">
      <Link href="/rate?tab=photos" className="text-sm text-zinc-500 hover:underline">
        &larr; All photos
      </Link>

      {posted && (
        <div className="mt-4">
          <PostedBanner title="Your captions are ready!" path={`/p/${id}`} />
        </div>
      )}

      <div className="mt-4">
        <GenerationCard
          generation={generation}
          votes={votes}
          signedIn={Boolean(viewer)}
          loginHref={loginHref}
          linkToDetail={false}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!posted && <CopyLinkButton path={`/p/${id}`} />}
        <Link
          href="/create"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Caption your own photo
        </Link>
        {viewer ? (
          <Link href="/rate?tab=new" className="text-sm text-blue-600 hover:underline">
            Rate more &rarr;
          </Link>
        ) : (
          <Link href={loginHref} className="text-sm text-blue-600 hover:underline">
            Sign in to vote
          </Link>
        )}
      </div>

      <details className="mt-10 rounded-2xl border border-zinc-200 bg-surface p-4 text-sm dark:border-zinc-800">
        <summary className="cursor-pointer font-medium">How these captions were made</summary>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-zinc-500">Model</dt>
          <dd className="font-mono">{generation.model}</dd>
          <dt className="text-zinc-500">Vibe</dt>
          <dd>{vibeLabel(generation.vibe)}</dd>
        </dl>
        <h3 className="mt-4 font-medium">System prompt</h3>
        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-900">
          {generation.system_prompt}
        </pre>
        <h3 className="mt-4 font-medium">Prompt (sent with the photo)</h3>
        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-900">
          {generation.prompt}
        </pre>
      </details>
    </main>
  );
}
