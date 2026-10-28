export const metadata = { title: "Privacy Policy · Hello World" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 font-sans leading-relaxed">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: October 7, 2026</p>

      <p className="mt-6">
        Hello World is a student project built for a university course. This page
        explains what it collects when you sign in with Google.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What we collect</h2>
      <ul className="mt-2 list-disc pl-6">
        <li>Your email address and Google account ID, received when you sign in with Google.</li>
        <li>The first and last name you enter.</li>
        <li>A profile photo, if you choose to upload one.</li>
        <li>
          Photos you post for captioning, the location you type with them, the AI
          captions, memes you post, and your votes.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">How it is used</h2>
      <p className="mt-2">
        Your account details are only used to sign you in and show your profile inside
        the app. It is stored with Supabase, is not sold, and is not used for
        advertising.
      </p>
      <p className="mt-4">
        Photos and memes you post are public, together with their captions, the
        location you typed, and your first name and last initial. To write the captions,
        the photo and location are sent to Anthropic&apos;s Claude API, or to
        Google&apos;s Gemini API when Claude can&apos;t answer. Google may
        use content sent to its free tier to improve its products, so please
        don&apos;t post photos of people who haven&apos;t agreed to it. Your
        individual votes are private; only the totals are shown.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Deleting your data</h2>
      <p className="mt-2">
        To have your account and data deleted, contact the developer at the
        support email shown on the Google sign-in screen.
      </p>
    </main>
  );
}
