import { Page } from "@/components/page";

export const metadata = { title: "Terms of Service · Hello World" };

export default function TermsPage() {
  return (
    <Page className="leading-relaxed">
      <h1 className="display text-[3.25rem]">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 30, 2026</p>

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
    </Page>
  );
}
