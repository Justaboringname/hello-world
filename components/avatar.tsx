const sizes = {
  sm: "h-8 w-8 text-xs",
  lg: "h-24 w-24 text-3xl",
};

export function Avatar({
  src,
  name,
  size = "sm",
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name}'s profile photo`}
        className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-zinc-200 object-cover dark:bg-zinc-800`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {initials}
    </span>
  );
}
