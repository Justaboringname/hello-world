import Link from "next/link";
import { Page } from "@/components/page";
import { btnPrimary, btnSecondary } from "@/lib/ui";

// Missing photos, memes and pages. Points back to the two places people go.
export default function NotFound() {
  return (
    <Page width="max-w-lg" className="flex flex-col items-center justify-center gap-3 text-center">
      <p className="display text-[7rem] leading-none text-rule">404</p>
      <h1 className="display text-[2.6rem]">This stop doesn&apos;t exist</h1>
      <p className="text-muted">The page isn&apos;t here, or the post was removed.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/rate" className={btnPrimary}>
          Go rate something
        </Link>
        <Link href="/" className={btnSecondary}>
          Home
        </Link>
      </div>
    </Page>
  );
}
