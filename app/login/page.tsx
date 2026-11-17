import { redirect } from "next/navigation";
import { signInWithGoogle, signInWithPassword } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { Page } from "@/components/page";
import { SubmitButton } from "@/components/submit-button";
import { devPasswordLoginEnabled, getViewer } from "@/lib/auth";
import { firstParam, safeNextPath } from "@/lib/redirect";
import { isProtected } from "@/lib/supabase/proxy";
import { btnSecondary, errorText, field } from "@/lib/ui";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));
  const error = firstParam(params.error);

  if (await getViewer()) redirect(next);

  return (
    <Page width="max-w-md" className="flex items-center">
      <div className="w-full overflow-hidden rounded-2xl border border-rule bg-surface">
        <div className="sign sign-line flex items-center gap-4 px-6 pb-5 pt-7">
          <Logo className="h-12 w-12 shrink-0" />
          <h1 className="display text-[3rem]">Sign in</h1>
        </div>

        <div className="p-6">
          <p className="text-muted">
            {isProtected(new URL(next, "http://x").pathname)
              ? "That page is for signed-in users only."
              : "Use your Google account to vote, post photos and see more memes."}
          </p>

          <form action={signInWithGoogle} className="mt-5">
            <input type="hidden" name="next" value={next} />
            <SubmitButton pendingLabel="Redirecting to Google…" className={`${btnSecondary} w-full gap-3`}>
              <GoogleIcon />
              Continue with Google
            </SubmitButton>
          </form>

          {devPasswordLoginEnabled() && (
            <form action={signInWithPassword} className="mt-6 flex flex-col gap-1 border-t border-rule pt-5">
              <p className="text-sm font-bold">Local dev: email and password</p>
              <input type="hidden" name="next" value={next} />
              <input name="email" type="email" autoComplete="username" placeholder="Email" className={field} />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className={field}
              />
              <SubmitButton pendingLabel="Signing in…" className={`${btnSecondary} mt-3`}>
                Sign in with password
              </SubmitButton>
            </form>
          )}

          {error && (
            <p role="alert" className={`mt-4 ${errorText}`}>
              Sign-in failed: {error}
            </p>
          )}
        </div>
      </div>
    </Page>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
