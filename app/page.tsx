import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { MemeImage } from "@/components/meme-image";
import {
  getTopCaptions,
  getTopMemes,
  getUnratedCount,
  memeImageUrl,
  photoUrl,
  type RankedCaption,
} from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";
import { daysAgo, startOfTodayInNewYork } from "@/lib/time";

export default async function Home() {
  const viewer = await getViewer();
  const [today, week, topMemes, unrated] = await Promise.all([
    getTopCaptions(startOfTodayInNewYork(), 1),
    getTopCaptions(daysAgo(7), 5),
    getTopMemes(4),
    getUnratedCount(viewer?.userId),
  ]);
  const captionOfTheDay = today[0];
  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 font-sans sm:py-14">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-600">
          Memes and AI captions from New York
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Snap the city. Vote on what&apos;s funny.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Post a meme, or a photo from your week in New York and let Gemini write
          three captions for it. Everyone votes, and the best caption each day is
          Caption of the Day.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/rate"
            className="rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Start rating
          </Link>
          <Link
            href="/create?mode=meme"
            className="rounded-full border border-zinc-300 bg-surface px-5 py-2.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Make a meme
          </Link>
          <Link
            href="/create"
            className="rounded-full border border-zinc-300 bg-surface px-5 py-2.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Caption a photo with AI
          </Link>
        </div>

        {viewer ? (
          <p className="mt-6 text-sm text-zinc-500">
            {isProfileComplete(viewer.profile) ? (
              <>Welcome back, {viewer.profile!.first_name}! </>
            ) : (
              <>
                Almost there:{" "}
                <Link href="/onboarding" className="text-blue-600 hover:underline">
                  add your name
                </Link>{" "}
                to finish setting up.{" "}
              </>
            )}
            {unrated === null ? null : unrated > 0 ? (
              <Link href="/rate?tab=new" className="font-medium text-blue-600 hover:underline">
                ✨ {unrated} new {unrated === 1 ? "post is" : "posts are"} waiting for your vote &rarr;
              </Link>
            ) : (
              "You're all caught up. Post something to keep it going!"
            )}
          </p>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            Anyone can look.{" "}
            <Link href="/login?next=/rate" className="text-blue-600 hover:underline">
              Sign in with Google
            </Link>{" "}
            to vote and post.
          </p>
        )}
      </section>

      {!viewer && (
        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["📸", "Snap the city", "Post a photo from your week, or a meme you made."],
            ["✨", "Gemini captions it", "Pick a vibe and get three AI captions in seconds."],
            ["👍", "Everyone votes", "The funniest caption each day is Caption of the Day."],
          ].map(([emoji, title, body], index) => (
            <li
              key={title}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-surface p-4 shadow-sm dark:border-zinc-800"
            >
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <span>
                <span className="block font-medium">
                  {index + 1}. {title}
                </span>
                <span className="block text-sm text-zinc-500">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-14">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Caption of the Day · {dateLabel}
        </h2>
        {captionOfTheDay ? (
          <CaptionOfTheDay caption={captionOfTheDay} />
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 bg-surface p-8 text-center dark:border-zinc-700">
            <p className="font-medium">Nobody has won today yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Post a photo or upvote today&apos;s captions to crown one. It resets
              at midnight.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Top this week
        </h2>
        {week.length > 0 ? (
          <ol className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-surface shadow-sm dark:divide-zinc-800 dark:border-zinc-800">
            {week.map((caption, index) => (
              <li key={caption.id}>
                <Link
                  href={`/p/${caption.generations.id}`}
                  className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  <span className="w-6 text-center text-lg font-semibold text-zinc-400">
                    {index + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(caption.generations.image_path)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{caption.text}</span>
                    <span className="block truncate text-sm text-zinc-500">
                      {[caption.generations.location, caption.generations.author_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-green-700 dark:text-green-500">
                    +{caption.score}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No votes this week yet.{" "}
            <Link href="/rate" className="text-blue-600 hover:underline">
              Go rate some captions &rarr;
            </Link>
          </p>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Top memes
          </h2>
          <Link href="/rate?tab=memes" className="text-sm text-blue-600 hover:underline">
            All memes &rarr;
          </Link>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {topMemes.map((meme) => (
            <Link
              key={meme.id}
              href={`/m/${meme.id}`}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-surface shadow-sm transition hover:shadow-lg dark:border-zinc-800"
            >
              <MemeImage
                src={memeImageUrl(meme)}
                alt={meme.title}
                topText={meme.top_text}
                bottomText={meme.bottom_text}
                variant="thumb"
              />
              <span className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate font-medium">{meme.title}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-500">
                  {meme.score > 0 ? `+${meme.score}` : meme.score}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function CaptionOfTheDay({ caption }: { caption: RankedCaption }) {
  const { generations: generation } = caption;
  return (
    <Link
      href={`/p/${generation.id}`}
      className="mt-3 grid overflow-hidden rounded-2xl border border-zinc-200 bg-surface shadow-sm transition hover:shadow-lg sm:grid-cols-2 dark:border-zinc-800"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(generation.image_path)}
        alt={generation.location ? `Photo from ${generation.location}` : "Winning photo"}
        className="aspect-[4/3] h-full w-full bg-zinc-100 object-cover dark:bg-zinc-900"
      />
      <div className="flex flex-col justify-center gap-3 p-6">
        <p className="text-3xl" aria-hidden>
          🏆
        </p>
        <p className="text-2xl font-semibold leading-snug">“{caption.text}”</p>
        <p className="text-sm text-zinc-500">
          {[generation.location && `📍 ${generation.location}`, generation.author_name && `by ${generation.author_name}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="text-sm font-semibold text-green-700 dark:text-green-500">
          +{caption.score} · {caption.upvotes} up, {caption.downvotes} down
        </p>
      </div>
    </Link>
  );
}
