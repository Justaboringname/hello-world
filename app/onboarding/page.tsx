import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/profile/actions";
import { NameForm } from "@/components/name-form";
import { Page, PageHeader } from "@/components/page";
import { requireViewer } from "@/lib/auth";
import { isProfileComplete, splitFullName } from "@/lib/profile";
import { firstParam, safeNextPath } from "@/lib/redirect";
import { card } from "@/lib/ui";

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
    <Page width="max-w-lg">
      <PageHeader title="Welcome">
        Before you continue, tell us what to call you. You can change this any
        time on your Profile page.
      </PageHeader>
      <div className={`${card} mt-8 p-6`}>
        <NameForm
          action={completeOnboarding}
          defaultFirstName={viewer.profile?.first_name ?? suggested.first}
          defaultLastName={viewer.profile?.last_name ?? suggested.last}
          submitLabel="Continue"
          next={next}
        />
      </div>
    </Page>
  );
}
