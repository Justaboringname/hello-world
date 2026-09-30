import { redirect } from "next/navigation";
import { MemeCard } from "@/components/meme-card";
import { requireViewer } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";

// The members-only route: proxy.ts bounces signed-out visitors to /login, and
// requireViewer re-checks here before anything renders.
export default async function VaultPage() {
  const viewer = await requireViewer("/vault");
  if (!isProfileComplete(viewer.profile)) redirect("/onboarding?next=/vault");

  const firstName = viewer.profile!.first_name!;
  const memes = [
    {
      title: "Success Kid",
      imageUrl: "https://i.imgflip.com/1bhk.jpg",
      topText: "Signed in with Google",
      bottomText: "Profile row made by a trigger",
    },
    {
      title: "Roll Safe",
      imageUrl: "https://i.imgflip.com/1h7in3.jpg",
      topText: "Can't forget your password",
      bottomText: "If you never made one",
    },
    {
      title: "X, X Everywhere",
      imageUrl: "https://i.imgflip.com/1ihzfe.jpg",
      topText: "Auth cookies",
      bottomText: "Auth cookies everywhere",
    },
    {
      title: "One Does Not Simply",
      imageUrl: "https://i.imgflip.com/1bij.jpg",
      topText: "One does not simply",
      bottomText: `walk into ${firstName}'s vault`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 font-sans">
      <p className="text-sm font-medium uppercase tracking-widest text-blue-600">
        Members only 🔒
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        The Vault, {firstName}
      </h1>
      <p className="mt-2 text-zinc-500">
        You can only see this page because you&apos;re signed in.
      </p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {memes.map((meme) => (
          <MemeCard key={meme.title} {...meme} />
        ))}
      </ul>
    </main>
  );
}
