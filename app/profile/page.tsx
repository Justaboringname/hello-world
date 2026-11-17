import Link from "next/link";
import { ViewTransition } from "react";
import { updateProfile } from "@/app/profile/actions";
import { Avatar } from "@/components/avatar";
import { AvatarUploader } from "@/components/avatar-uploader";
import { ThumbUp } from "@/components/icons";
import { NameForm } from "@/components/name-form";
import { Page } from "@/components/page";
import { UnfinishedDuels } from "@/components/unfinished-duels";
import { requireViewer } from "@/lib/auth";
import { getMyUnfinishedDuels } from "@/lib/duels";
import { getMyPosts, memeImageUrl, photoUrl, type FeedItem } from "@/lib/feed";
import { timeAgo } from "@/lib/time";
import { btnPrimary, btnSecondary, card, textLink } from "@/lib/ui";

// How many of your posts the grid shows; the stats count all of them.
const GRID_SIZE = 24;

// One tile's worth of a post: where it links, its picture, and how it's doing.
function postSummary(item: FeedItem) {
  if (item.kind === "photo") {
    const { generation } = item;
    const best = [...generation.captions].sort((a, b) => b.score - a.score)[0];
    return {
      key: `photo-${generation.id}`,
      href: `/p/${generation.id}`,
      src: photoUrl(generation.image_path),
      label: "AI captions",
      title: best?.text ?? generation.location ?? "Photo",
      isCaption: Boolean(best),
      upvotes: generation.captions.reduce((sum, caption) => sum + caption.upvotes, 0),
      createdAt: generation.created_at,
    };
  }
  const { meme } = item;
  return {
    key: `meme-${meme.id}`,
    href: `/m/${meme.id}`,
    src: memeImageUrl(meme),
    label: "Meme",
    title: meme.title,
    isCaption: false,
    upvotes: meme.upvotes,
    createdAt: meme.created_at,
  };
}

export default async function ProfilePage() {
  const viewer = await requireViewer("/profile");
  const { profile } = viewer;
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    viewer.email ||
    "";

  const [myPosts, unfinished] = await Promise.all([
    getMyPosts(viewer.userId),
    getMyUnfinishedDuels(viewer.userId),
  ]);
  const posts = myPosts.items.map(postSummary);
  const upvotes = posts.reduce((sum, post) => sum + post.upvotes, 0);

  return (
    <Page width="max-w-3xl">
      <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <Avatar src={profile?.avatar_url} name={name} size="lg" className="ring-4 ring-yellow" />
        <div className="min-w-0 flex-1">
          <h1 className="display text-[2.8rem] sm:text-[3.4rem]">{name || "Your profile"}</h1>
          <p className="mt-1 truncate text-muted">{viewer.email}</p>
        </div>
        <dl className="flex gap-3">
          <div className={`${card} min-w-28 px-5 py-3 text-center`}>
            <dd className="display text-[2.6rem] tabular-nums">{posts.length}</dd>
            <dt className="text-sm text-muted">{posts.length === 1 ? "post" : "posts"}</dt>
          </div>
          <div className={`${card} min-w-28 px-5 py-3 text-center`}>
            <dd className="display text-[2.6rem] tabular-nums text-up">{upvotes}</dd>
            <dt className="text-sm text-muted">{upvotes === 1 ? "upvote" : "upvotes"} received</dt>
          </div>
        </dl>
      </section>

      {unfinished.length > 0 && (
        <div className="mt-8">
          <UnfinishedDuels duels={unfinished} title="Your unfinished duels" />
        </div>
      )}

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-[2.1rem]">Your posts</h2>
          {posts.length > 0 && (
            <Link href="/create" className={`${textLink} text-sm`}>
              Post something
            </Link>
          )}
        </div>
        {myPosts.error ? (
          <p className="mt-3 font-medium text-down">
            Couldn&apos;t load your posts: {myPosts.error.message}
          </p>
        ) : posts.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-rule bg-surface p-7">
            <p className="text-[1.1rem] font-bold">You haven&apos;t posted anything yet</p>
            <p className="max-w-sm text-muted">
              Your memes and captioned photos show up here, with how many upvotes
              each one gets.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/create?mode=meme" className={btnPrimary}>
                Make a meme
              </Link>
              <Link href="/create" className={btnSecondary}>
                Caption a photo with AI
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {posts.slice(0, GRID_SIZE).map((post) => (
                <li key={post.key}>
                  <Link
                    href={post.href}
                    className={`${card} group block overflow-hidden transition-colors hover:border-ink`}
                  >
                    <span className="relative block aspect-square overflow-hidden bg-black">
                      <ViewTransition name={post.key} share="morph" default="none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </ViewTransition>
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-bold tabular-nums text-white">
                        <ThumbUp />
                        {post.upvotes}
                      </span>
                    </span>
                    <span className="block px-3.5 py-2.5">
                      <span className={`block truncate ${post.isCaption ? "joke" : "text-sm font-bold"}`}>
                        {post.isCaption ? `“${post.title}”` : post.title}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {post.label}, {timeAgo(post.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {posts.length > GRID_SIZE && (
              <p className="mt-3 text-sm text-muted">
                Showing your {GRID_SIZE} newest of {posts.length} posts.
              </p>
            )}
          </>
        )}
      </section>

      <h2 className="display mt-14 text-[2.1rem]">Settings</h2>
      <section className={`${card} mt-4 p-6`}>
        <h3 className="font-bold">Photo</h3>
        <div className="mt-4 flex items-center gap-6">
          <Avatar src={profile?.avatar_url} name={name} size="lg" />
          <AvatarUploader userId={viewer.userId} />
        </div>
      </section>

      <section className={`${card} mt-4 p-6`}>
        <h3 className="font-bold">Name</h3>
        <p className="mt-1 text-sm text-muted">
          Your posts show your first name and last initial.
        </p>
        <div className="mt-4">
          <NameForm
            action={updateProfile}
            defaultFirstName={profile?.first_name ?? ""}
            defaultLastName={profile?.last_name ?? ""}
            submitLabel="Save changes"
          />
        </div>
      </section>
    </Page>
  );
}
