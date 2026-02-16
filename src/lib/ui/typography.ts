// Typography contract — single source of truth for the ICelerate type ladder.
// Import TYPO.* in components instead of writing raw Tailwind text classes.

export const TYPO = {
  pageTitle: "text-2xl font-semibold",
  cardTitle: "text-base font-semibold",
  sectionHeader: "text-xs font-semibold uppercase tracking-[1.2px]",
  body: "text-sm",
  meta: "text-xs",
  kpi: "text-3xl font-data font-bold",
  badgeTiny: "text-[10px] leading-none",
} as const;

export type TypoKey = keyof typeof TYPO;

/** Lightweight class joiner — use instead of string templates when combining TYPO tokens with overrides */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
