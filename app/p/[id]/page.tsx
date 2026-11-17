import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bullet } from "@/components/bullet";
import { CopyLinkButton } from "@/components/copy-link-button";
import { GenerationCard } from "@/components/generation-card";
import { Page } from "@/components/page";
import { PostedBanner } from "@/components/posted-banner";
import { VibeBadge } from "@/components/vibe-badge";
import { getViewer } from "@/lib/auth";
import { getGeneration, getMyVotes, photoUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";
import { btnPrimary, btnSecondary, textLink } from "@/lib/ui";

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
    <Page>
      <Link href="/rate?tab=photos" className="text-sm font-semibold text-muted hover:text-ink">
        &larr; All photos
      </Link>

      {posted && (
        <div className="mt-4">
          <PostedBanner title="Your captions are ready" path={`/p/${id}`} />
        </div>
      )}

      <div className="mt-4">
        <GenerationCard
          generation={generation}
          votes={votes}
          signedIn={Boolean(viewer)}
          loginHref={loginHref}
          linkToDetail={false}
          reveal={posted}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4">
        <Link href={`/duel?photo=${id}`} className={btnPrimary}>
          <Bullet color="orange" className="text-[0.95rem]">
            B
          </Bullet>
          Beat the bot on this photo
        </Link>
        {!posted && <CopyLinkButton path={`/p/${id}`} />}
        <Link href="/create" className={btnSecondary}>
          Caption your own photo
        </Link>
        {viewer ? (
          <Link href="/rate?tab=new" className={`${textLink} ml-1 text-sm`}>
            Rate more
          </Link>
        ) : (
          <Link href={loginHref} className={`${textLink} ml-1 text-sm`}>
            Sign in to vote
          </Link>
        )}
      </div>

      <details className="group mt-10 rounded-2xl border border-rule bg-surface px-5 py-4 text-sm">
        <summary className="cursor-pointer font-bold">How these captions were made</summary>
        <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2.5">
          <dt className="text-muted">Model</dt>
          <dd className="font-mono text-[0.8rem]">{generation.model}</dd>
          <dt className="text-muted">Vibe</dt>
          <dd>
            <VibeBadge vibe={generation.vibe} />
          </dd>
        </dl>
        <h3 className="mt-5 font-bold">System prompt</h3>
        <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-raised p-3.5 font-mono text-xs leading-relaxed">
          {generation.system_prompt}
        </pre>
        <h3 className="mt-5 font-bold">Prompt (sent with the photo)</h3>
        <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-raised p-3.5 font-mono text-xs leading-relaxed">
          {generation.prompt}
        </pre>
      </details>
    </Page>
  );
}
