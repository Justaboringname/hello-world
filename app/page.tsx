import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getTopCaptions, getUnratedCount, photoUrl, type RankedCaption } from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";
import { daysAgo, startOfTodayInNewYork } from "@/lib/time";

export default async function Home() {
  const viewer = await getViewer();
  const [today, week, unrated] = await Promise.all([
    getTopCaptions(startOfTodayInNewYork(), 1),
    getTopCaptions(daysAgo(7), 5),
    viewer ? getUnratedCount(viewer.userId) : null,
  ]);
  const captionOfTheDay = today[0];
  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 font-sans">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-600">
          New York, captioned by AI
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Snap the city. Vote on the funniest caption.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Post a photo from your week in New York, and Gemini writes three captions
          for it. Everyone votes, and the best one each day is Caption of the Day.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/rate"
            className="rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Start rating
          </Link>
          <Link
            href="/create"
            className="rounded-full border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Caption a photo
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
            {unrated ? (
              <Link href="/rate" className="font-medium text-blue-600 hover:underline">
                {unrated} {unrated === 1 ? "caption or meme is" : "captions and memes are"} waiting for your vote.
              </Link>
            ) : (
              "You've rated everything. Post a photo to keep it going!"
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

      <section className="mt-14">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Caption of the Day · {dateLabel}
        </h2>
        {captionOfTheDay ? (
          <CaptionOfTheDay caption={captionOfTheDay} />
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
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
          <ol className="mt-3 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {week.map((caption, index) => (
              <li key={caption.id}>
                <Link
                  href={`/p/${caption.generations.id}`}
                  className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
    </main>
  );
}

function CaptionOfTheDay({ caption }: { caption: RankedCaption }) {
  const { generations: generation } = caption;
  return (
    <Link
      href={`/p/${generation.id}`}
      className="mt-3 grid overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-lg sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950"
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
