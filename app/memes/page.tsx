import Link from "next/link";
import { connection } from "next/server";
import { MemeCard } from "@/components/meme-card";
import { getSupabase } from "@/lib/supabase/anon";

type Meme = {
  id: number;
  title: string;
  image_url: string;
  top_text: string | null;
  bottom_text: string | null;
};

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
            <MemeCard
              key={meme.id}
              title={meme.title}
              imageUrl={meme.image_url}
              topText={meme.top_text}
              bottomText={meme.bottom_text}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
