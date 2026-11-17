// Class names shared by buttons, links, fields and panels, so every page
// presses, underlines and outlines the same way.

const key =
  "key inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-55";

const primary = `${key} bg-accent text-on-accent shadow-[0_3px_0_var(--accent-edge)] hover:brightness-105`;
const secondary = `${key} border-[1.5px] border-rule bg-surface text-ink shadow-[0_3px_0_var(--rule)] hover:border-muted`;

export const btnPrimary = `${primary} px-5 py-2.5`;
export const btnSecondary = `${secondary} px-5 py-2.5`;
export const btnPrimarySmall = `${primary} px-3.5 py-1.5 text-sm`;
export const btnSecondarySmall = `${secondary} px-3.5 py-1.5 text-sm`;

export const textLink =
  "font-semibold underline decoration-accent decoration-[3px] underline-offset-4 hover:decoration-current";

export const field =
  "mt-1.5 w-full rounded-xl border-[1.5px] border-rule bg-surface px-3.5 py-2.5 text-base font-normal text-ink outline-none placeholder:text-muted/70 focus:border-ink";

export const card = "rounded-2xl border border-rule bg-surface";

export const errorText = "text-sm font-medium text-down";
