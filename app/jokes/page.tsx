import Link from "next/link";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";

type Joke = {
  id: number;
  setup: string;
  punchline: string;
};

export default async function JokesPage() {
  await connection();

  const { data: jokes, error } = await getSupabase()
    .from("jokes")
    .select("id, setup, punchline")
    .order("id");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        &larr; Home
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Jokes</h1>
      <p className="mt-2 text-zinc-500">Rows from the Supabase jokes table.</p>

      {error ? (
        <p className="mt-8 text-red-600">Failed to load jokes: {error.message}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {(jokes as Joke[]).map((joke) => (
            <li key={joke.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-medium">{joke.setup}</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{joke.punchline}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
