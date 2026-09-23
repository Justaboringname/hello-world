import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Hello World
      </h1>
      <Link href="/memes" className="text-lg text-blue-600 hover:underline">
        View memes &rarr;
      </Link>
    </main>
  );
}
