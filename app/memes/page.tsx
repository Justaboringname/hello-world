import Link from "next/link";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";

type Meme = {
  id: number;
  title: string;
  image_url: string;
  top_text: string | null;
  bottom_text: string | null;
};

const captionClass =
  "absolute inset-x-2 text-center font-black uppercase leading-tight text-white text-2xl [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]";

export default async function MemesPage() {
  await connection();

  const { data: memes, error } = await getSupabase()
    .from("memes")
    .select("id, title, image_url, top_text, bottom_text")
    .order("id");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 font-sans">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        &larr; Home
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Memes</h1>
      <p className="mt-2 text-zinc-500">Rows from the Supabase memes table.</p>

      {error ? (
        <p className="mt-8 text-red-600">Failed to load memes: {error.message}</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {(memes as Meme[]).map((meme) => (
            <li
              key={meme.id}
              className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="relative bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meme.image_url} alt={meme.title} className="w-full" />
                {meme.top_text && <p className={`${captionClass} top-2`}>{meme.top_text}</p>}
                {meme.bottom_text && (
                  <p className={`${captionClass} bottom-2`}>{meme.bottom_text}</p>
                )}
              </div>
              <p className="p-3 font-medium">{meme.title}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
