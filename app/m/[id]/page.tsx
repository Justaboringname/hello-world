import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/copy-link-button";
import { MemeCard } from "@/components/meme-card";
import { PostedBanner } from "@/components/posted-banner";
import { getViewer } from "@/lib/auth";
import { getMeme, getMyMemeVotes, memeImageUrl } from "@/lib/feed";
import { firstParam } from "@/lib/redirect";

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
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-10 text-center dark:border-blue-900 dark:bg-blue-950/30">
          <p className="text-4xl" aria-hidden>
            🔒
          </p>
          <h1 className="text-xl font-semibold">This meme is for members</h1>
          <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with Google to see it, or it may have been removed.
          </p>
          <Link
            href={loginHref}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    );
  }

  const votes = await getMyMemeVotes(viewer?.userId, [meme.id]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 font-sans sm:py-12">
      <Link href="/rate?tab=memes" className="text-sm text-zinc-500 hover:underline">
        &larr; All memes
      </Link>

      {posted && (
        <div className="mt-4">
          <PostedBanner title="Your meme is live!" path={path} />
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!posted && <CopyLinkButton path={path} title={meme.title} />}
        <Link
          href="/create?mode=meme"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Make your own meme
        </Link>
        <Link href="/rate?tab=new" className="text-sm text-blue-600 hover:underline">
          Rate more &rarr;
        </Link>
      </div>
    </main>
  );
}
