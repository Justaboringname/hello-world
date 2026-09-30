// Where to send the user after Google sign-in. Supabase must redirect to
// exactly /auth/callback (no query string), so the destination rides along in
// a short-lived cookie instead.
export const NEXT_PATH_COOKIE = "post_auth_next";

// Only allow same-origin relative paths, so ?next= cannot become an open
// redirect to another site.
export function safeNextPath(value: unknown, fallback = "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback;
  }
  return value;
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
