import Link from "next/link";
import { updateProfile } from "@/app/profile/actions";
import { Avatar } from "@/components/avatar";
import { AvatarUploader } from "@/components/avatar-uploader";
import { NameForm } from "@/components/name-form";
import { requireViewer } from "@/lib/auth";
import { getMyPosts, memeImageUrl, photoUrl, type FeedItem } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

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
      label: "📸 AI captions",
      title: best?.text ?? generation.location ?? "Photo",
      upvotes: generation.captions.reduce((sum, caption) => sum + caption.upvotes, 0),
      createdAt: generation.created_at,
    };
  }
  const { meme } = item;
  return {
    key: `meme-${meme.id}`,
    href: `/m/${meme.id}`,
    src: memeImageUrl(meme),
    label: "😂 Meme",
    title: meme.title,
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

  const myPosts = await getMyPosts(viewer.userId);
  const posts = myPosts.items.map(postSummary);
  const upvotes = posts.reduce((sum, post) => sum + post.upvotes, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 font-sans sm:py-12">
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-200 bg-surface p-6 text-center shadow-sm sm:flex-row sm:text-left dark:border-zinc-800">
        <Avatar src={profile?.avatar_url} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{name || "Your profile"}</h1>
          <p className="truncate text-sm text-zinc-500">{viewer.email}</p>
          <dl className="mt-4 flex justify-center gap-6 sm:justify-start">
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">Posts</dt>
              <dd className="text-2xl font-semibold tabular-nums">{posts.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">👍 received</dt>
              <dd className="text-2xl font-semibold tabular-nums">{upvotes}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Your posts</h2>
          {posts.length > 0 && (
            <Link href="/create" className="text-sm text-blue-600 hover:underline">
              + Post something
            </Link>
          )}
        </div>
        {myPosts.error ? (
          <p className="mt-3 text-sm text-red-600">
            Couldn&apos;t load your posts: {myPosts.error.message}
          </p>
        ) : posts.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-surface p-8 text-center dark:border-zinc-700">
            <p className="font-medium">You haven&apos;t posted anything yet.</p>
            <p className="max-w-sm text-sm text-zinc-500">
              Your memes and captioned photos show up here, with how many upvotes
              each one gets.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Link
                href="/create?mode=meme"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Make a meme
              </Link>
              <Link
                href="/create"
                className="rounded-full border border-zinc-300 bg-surface px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Caption a photo with AI
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {posts.slice(0, GRID_SIZE).map((post) => (
                <li key={post.key}>
                  <Link
                    href={post.href}
                    className="group block overflow-hidden rounded-xl border border-zinc-200 bg-surface shadow-sm transition hover:shadow-md dark:border-zinc-800"
                  >
                    <span className="relative block aspect-square overflow-hidden bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.src}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-900 shadow-sm">
                        👍 {post.upvotes}
                      </span>
                    </span>
                    <span className="block px-3 py-2">
                      <span className="block truncate text-sm font-medium">{post.title}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {post.label} · {timeAgo(post.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {posts.length > GRID_SIZE && (
              <p className="mt-3 text-sm text-zinc-500">
                Showing your {GRID_SIZE} newest of {posts.length} posts.
              </p>
            )}
          </>
        )}
      </section>

      <h2 className="mt-12 text-lg font-semibold">Settings</h2>
      <section className="mt-3 rounded-2xl border border-zinc-200 bg-surface p-6 shadow-sm dark:border-zinc-800">
        <h3 className="font-semibold">Photo</h3>
        <div className="mt-4 flex items-center gap-6">
          <Avatar src={profile?.avatar_url} name={name} size="lg" />
          <AvatarUploader userId={viewer.userId} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-surface p-6 shadow-sm dark:border-zinc-800">
        <h3 className="font-semibold">Name</h3>
        <p className="mt-1 text-sm text-zinc-500">
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
    </main>
  );
}
