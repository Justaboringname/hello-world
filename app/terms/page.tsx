export const metadata = { title: "Terms of Service · Hello World" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans leading-relaxed">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: September 30, 2026</p>

      <p className="mt-6">
        Hello World is a non-commercial student project built for a university
        course. It is provided as is, without any warranty, and may change or be
        taken down at any time.
      </p>
      <p className="mt-4">
        Please only upload photos you have the right to share, and do not use the
        app for anything unlawful. Questions can be sent to the support email
        shown on the Google sign-in screen.
      </p>
    </main>
  );
}
