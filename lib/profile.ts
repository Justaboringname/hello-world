export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// One file per user, overwritten on each upload. The first folder segment is
// the user id, which the storage policies in supabase/profiles.sql check.
export function avatarPath(userId: string) {
  return `${userId}/avatar`;
}

const NAME_MAX_LENGTH = 50;

export function isProfileComplete(
  profile: Pick<Profile, "first_name" | "last_name"> | null | undefined,
) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

export function parseNames(
  formData: FormData,
):
  | { ok: true; firstName: string; lastName: string }
  | { ok: false; message: string } {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { ok: false, message: "Please enter both a first and last name." };
  }
  if (firstName.length > NAME_MAX_LENGTH || lastName.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Names must be ${NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, firstName, lastName };
}

// Best-effort split of Google's full name, used only to pre-fill the form.
export function splitFullName(fullName: unknown) {
  if (typeof fullName !== "string") return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}
