import { updateProfile } from "@/app/profile/actions";
import { Avatar } from "@/components/avatar";
import { AvatarUploader } from "@/components/avatar-uploader";
import { NameForm } from "@/components/name-form";
import { requireViewer } from "@/lib/auth";

export default async function ProfilePage() {
  const viewer = await requireViewer("/profile");
  const { profile } = viewer;
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    viewer.email ||
    "";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-zinc-500">Signed in as {viewer.email}</p>

      <section className="mt-10 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Photo</h2>
        <div className="mt-4 flex items-center gap-6">
          <Avatar src={profile?.avatar_url} name={name} size="lg" />
          <AvatarUploader userId={viewer.userId} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Name</h2>
        <div className="mt-4">
          <NameForm
            action={updateProfile}
            defaultFirstName={profile?.first_name ?? ""}
            defaultLastName={profile?.last_name ?? ""}
            submitLabel="Save changes"
          />
        </div>
      </section>
    </main>
  );
}
