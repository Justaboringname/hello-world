import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/profile/actions";
import { NameForm } from "@/components/name-form";
import { requireViewer } from "@/lib/auth";
import { isProfileComplete, splitFullName } from "@/lib/profile";
import { firstParam, safeNextPath } from "@/lib/redirect";

// Shown right after sign-in whenever first_name or last_name is still empty.
export default async function OnboardingPage({
  searchParams,
}: PageProps<"/onboarding">) {
  const next = safeNextPath(firstParam((await searchParams).next));
  const viewer = await requireViewer(`/onboarding?next=${encodeURIComponent(next)}`);

  if (isProfileComplete(viewer.profile)) redirect(next);

  // Pre-fill from Google as a suggestion; nothing is saved until they submit.
  const suggested = splitFullName(viewer.fullName);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome! 👋</h1>
      <p className="mt-2 text-zinc-500">
        Before you continue, tell us what to call you. You can change this any
        time on your Profile page.
      </p>
      <div className="mt-8">
        <NameForm
          action={completeOnboarding}
          defaultFirstName={viewer.profile?.first_name ?? suggested.first}
          defaultLastName={viewer.profile?.last_name ?? suggested.last}
          submitLabel="Continue"
          next={next}
        />
      </div>
    </main>
  );
}
