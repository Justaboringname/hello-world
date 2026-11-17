// The app mark: a smiling speech bubble (a caption that made you laugh) on a
// blue route bullet. Same drawing as app/icon.svg.
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="var(--accent)" />
      <path
        d="M10.4 8.6h11.2a3 3 0 0 1 3 3v5.6a3 3 0 0 1-3 3H16l-4.3 3.9v-3.9h-1.3a3 3 0 0 1-3-3v-5.6a3 3 0 0 1 3-3z"
        fill="var(--on-accent)"
      />
      <circle cx="13" cy="12.9" r="1.15" fill="var(--accent)" />
      <circle cx="19" cy="12.9" r="1.15" fill="var(--accent)" />
      <path
        d="M12.4 15.6c1 1.4 2.2 2 3.6 2s2.6-.6 3.6-2"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
