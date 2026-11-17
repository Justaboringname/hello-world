"use client";

import { useFormStatus } from "react-dom";

// A submit button that shows its form is busy. The look comes from className
// (see lib/ui.ts).
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`disabled:cursor-wait ${className}`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
