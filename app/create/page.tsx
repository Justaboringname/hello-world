import { redirect } from "next/navigation";
import { CreateForm } from "@/components/create-form";
import { requireViewer } from "@/lib/auth";
import { DAILY_GENERATION_LIMIT } from "@/lib/captions";
import { countRecentGenerations } from "@/lib/feed";
import { isProfileComplete } from "@/lib/profile";

export const metadata = { title: "Caption a photo · Hello World" };

// The Gemini call runs inside this page's Server Action; give it room.
export const maxDuration = 60;

export default async function CreatePage() {
  const viewer = await requireViewer("/create");
  // Posts show "First L.", so make sure there is a name first.
  if (!isProfileComplete(viewer.profile)) redirect("/onboarding?next=/create");

  const remaining = DAILY_GENERATION_LIMIT - (await countRecentGenerations(viewer.userId));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">Caption a photo</h1>
      <p className="mt-2 text-zinc-500">
        Upload something you saw around the city. Gemini writes three captions in
        the vibe you pick, then everyone votes on the funniest one. Your photo and
        captions are public, posted as{" "}
        <strong className="font-medium text-zinc-700 dark:text-zinc-300">
          {viewer.profile!.first_name} {viewer.profile!.last_name![0]}.
        </strong>
      </p>
      <div className="mt-8">
        <CreateForm remaining={remaining} />
      </div>
    </main>
  );
}
