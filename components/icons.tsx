import type { ReactNode } from "react";

// Small line icons, drawn at the size of the text around them.
function Icon({ children, className = "h-[1.1em] w-[1.1em]" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

type Props = { className?: string };

export const ThumbUp = (props: Props) => (
  <Icon {...props}>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </Icon>
);

export const ThumbDown = (props: Props) => (
  <Icon {...props}>
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
  </Icon>
);

export const Crown = (props: Props) => (
  <Icon {...props}>
    <path d="m2.5 7 3.2 10h12.6l3.2-10-5.6 4.4L12 5l-3.9 6.4L2.5 7Z" fill="currentColor" />
    <path d="M6 20.5h12" />
  </Icon>
);

export const Pin = (props: Props) => (
  <Icon {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

export const Lock = (props: Props) => (
  <Icon {...props}>
    <rect x="3.5" y="11" width="17" height="10.5" rx="2.5" />
    <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
  </Icon>
);

export const LinkIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

export const Camera = (props: Props) => (
  <Icon {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
    <circle cx="12" cy="13" r="3.2" />
  </Icon>
);

export const Picture = (props: Props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m21 15-4.6-4.6a1.5 1.5 0 0 0-2.1 0L5 20" />
  </Icon>
);

export const Check = (props: Props) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
