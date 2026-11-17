import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Lock } from "@/components/icons";
import { MemeCard } from "@/components/meme-card";
import { Page } from "@/components/page";
import { PostedBanner } from "@/components/posted-banner";
import { getViewer } from "@/lib/auth";
import { getMeme, getMyMemeVotes, memeImageUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";
import { btnPrimary, textLink } from "@/lib/ui";

function parseId(value: string) {
  return /^\d{1,15}$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({ params }: PageProps<"/m/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const meme = id ? await getMeme(id) : null;
  if (!meme) return { title: "Meme · Hello World" };

  return {
    title: `${meme.title} · Hello World`,
    description: "Vote on this meme.",
    openGraph: { title: meme.title, images: [memeImageUrl(meme)] },
  };
}

// One meme: the link people share, and where you land after posting one.
export default async function MemePage({ params, searchParams }: PageProps<"/m/[id]">) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const posted = firstParam((await searchParams).posted) === "1";

  const [viewer, meme] = await Promise.all([getViewer(), getMeme(id)]);
  const path = `/m/${id}`;
  const loginHref = `/login?next=${encodeURIComponent(path)}`;

  if (!meme) {
    // RLS hides members-only memes from signed-out visitors, so a shared
    // link to one looks missing until they sign in.
    if (viewer) notFound();
    return (
      <Page className="flex items-center">
        <div className="sign sign-line flex w-full flex-col items-center gap-3 rounded-2xl px-6 pb-10 pt-12 text-center">
          <Lock className="h-9 w-9" />
          <h1 className="display text-[2.6rem]">This meme is for members</h1>
          <p className="max-w-sm text-sign-muted">
            Sign in with Google to see it, or it may have been removed.
          </p>
          <Link href={loginHref} className={`${btnPrimary} mt-3`}>
            Sign in with Google
          </Link>
        </div>
      </Page>
    );
  }

  const votes = await getMyMemeVotes(viewer?.userId, [meme.id]);

  return (
    <Page>
      <Link href="/rate?tab=memes" className="text-sm font-semibold text-muted hover:text-ink">
        &larr; All memes
      </Link>

      {posted && (
        <div className="mt-4">
          <PostedBanner title="Your meme is live" path={path} />
        </div>
      )}

      <div className="mt-4">
        <MemeCard
          meme={meme}
          myVote={votes.get(meme.id) ?? null}
          signedIn={Boolean(viewer)}
          loginHref={loginHref}
          linkToDetail={false}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4">
        <Link href="/create?mode=meme" className={btnPrimary}>
          Make your own meme
        </Link>
        {!posted && <CopyLinkButton path={path} title={meme.title} />}
        <Link href="/rate?tab=new" className={`${textLink} ml-1 text-sm`}>
          Rate more
        </Link>
      </div>
    </Page>
  );
}
